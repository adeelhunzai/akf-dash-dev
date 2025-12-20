<?php
/**
 * Rate Limiter class
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Rate Limiter class
 */
class AKF_Rate_Limiter {
	
	/**
	 * Single instance
	 *
	 * @var AKF_Rate_Limiter
	 */
	private static $instance = null;
	
	/**
	 * Get instance
	 *
	 * @return AKF_Rate_Limiter
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}
	
	/**
	 * Constructor
	 */
	private function __construct() {
		// Private constructor for singleton
	}
	
	/**
	 * Check if request is rate limited
	 *
	 * @param string|int $identifier User ID or IP address
	 * @param string $action Action name
	 * @param int $max_attempts Maximum attempts
	 * @param int $time_window Time window in seconds
	 * @return array Array with 'allowed', 'remaining', 'reset_at'
	 */
	public static function check( $identifier, $action, $max_attempts = 5, $time_window = 300 ) {
		$key = 'rate_limit_' . $action . '_' . md5( $identifier );
		$attempts = get_transient( $key );
		
		if ( $attempts === false ) {
			set_transient( $key, 1, $time_window );
			return array(
				'allowed' => true,
				'remaining' => $max_attempts - 1,
				'reset_at' => time() + $time_window,
			);
		}
		
		$attempts = intval( $attempts );
		
		if ( $attempts >= $max_attempts ) {
			self::log_rate_limit( $identifier, $action );
			return array(
				'allowed' => false,
				'remaining' => 0,
				'reset_at' => time() + $time_window,
			);
		}
		
		set_transient( $key, $attempts + 1, $time_window );
		
		return array(
			'allowed' => true,
			'remaining' => $max_attempts - ( $attempts + 1 ),
			'reset_at' => time() + $time_window,
		);
	}
	
	/**
	 * Reset rate limit for an identifier
	 *
	 * @param string|int $identifier User ID or IP address
	 * @param string $action Action name
	 */
	public static function reset( $identifier, $action ) {
		$key = 'rate_limit_' . $action . '_' . md5( $identifier );
		delete_transient( $key );
	}
	
	/**
	 * Check if request is allowed (simplified interface)
	 *
	 * @param int $user_id User ID
	 * @param string $ip_address IP address
	 * @return bool
	 */
	public function is_allowed( $user_id, $ip_address ) {
		$identifier = $user_id > 0 ? $user_id : $ip_address;
		$rate_check = self::check( $identifier, 'api_request', 100, 60 ); // 100 requests per minute
		return $rate_check['allowed'];
	}
	
	/**
	 * Check if request is rate limited based on failures only
	 * This does NOT increment the counter - use record_failure() to count failures
	 *
	 * @param string|int $identifier User ID or IP address
	 * @param string $action Action name
	 * @param int $max_failures Maximum failed attempts allowed
	 * @param int $time_window Time window in seconds
	 * @return array Array with 'allowed', 'remaining', 'reset_at'
	 */
	public static function check_failures_only( $identifier, $action, $max_failures = 20, $time_window = 300 ) {
		$key = 'rate_limit_' . $action . '_' . md5( $identifier );
		$failures = get_transient( $key );
		
		if ( $failures === false ) {
			return array(
				'allowed' => true,
				'remaining' => $max_failures,
				'reset_at' => time() + $time_window,
			);
		}
		
		$failures = intval( $failures );
		
		if ( $failures >= $max_failures ) {
			self::log_rate_limit( $identifier, $action );
			return array(
				'allowed' => false,
				'remaining' => 0,
				'reset_at' => time() + $time_window,
			);
		}
		
		return array(
			'allowed' => true,
			'remaining' => $max_failures - $failures,
			'reset_at' => time() + $time_window,
		);
	}
	
	/**
	 * Record a failed attempt for failure-only rate limiting
	 *
	 * @param string|int $identifier User ID or IP address
	 * @param string $action Action name
	 * @param int $time_window Time window in seconds
	 */
	public static function record_failure( $identifier, $action, $time_window = 300 ) {
		$key = 'rate_limit_' . $action . '_' . md5( $identifier );
		$failures = get_transient( $key );
		
		if ( $failures === false ) {
			set_transient( $key, 1, $time_window );
		} else {
			set_transient( $key, intval( $failures ) + 1, $time_window );
		}
	}
	
	/**
	 * Log rate limit violation
	 *
	 * @param string|int $identifier User ID or IP address
	 * @param string $action Action name
	 */
	private static function log_rate_limit( $identifier, $action ) {
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
		$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : 'unknown';
		
		error_log( sprintf(
			'[RATE_LIMIT] Action: %s, Identifier: %s, IP: %s, User-Agent: %s',
			$action,
			$identifier,
			$ip,
			$user_agent
		) );
	}
}

