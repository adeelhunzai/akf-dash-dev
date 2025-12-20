<?php
/**
 * Base REST Controller class
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Base REST Controller
 */
abstract class AKF_REST_Controller extends WP_REST_Controller {
	
	/**
	 * Namespace for the REST API
	 *
	 * @var string
	 */
	protected $namespace = 'custom-api/v1';
	
	/**
	 * JWT Manager instance
	 *
	 * @var AKF_JWT_Manager
	 */
	protected $jwt_manager;
	
	/**
	 * Rate Limiter instance
	 *
	 * @var AKF_Rate_Limiter
	 */
	protected $rate_limiter;
	
	/**
	 * Constructor
	 */
	public function __construct() {
		$this->jwt_manager = AKF_JWT_Manager::get_instance();
		$this->rate_limiter = AKF_Rate_Limiter::get_instance();
	}
	
	/**
	 * Check if user has permission to access the endpoint
	 *
	 * @param WP_REST_Request $request Request object
	 * @return bool|WP_Error
	 */
	public function check_permission( $request ) {
		// This should be overridden in child classes
		return current_user_can( 'read' );
	}
	
	/**
	 * Validate JWT token
	 *
	 * @param WP_REST_Request $request Request object
	 * @return bool|WP_Error
	 */
	protected function validate_jwt( $request ) {
		$token = $this->get_token_from_request( $request );
		
		if ( ! $token ) {
			return new WP_Error(
				'rest_unauthorized',
				__( 'Authentication token required.', 'akf-learning-dashboard' ),
				array( 'status' => 401 )
			);
		}
		
		$user_id = $this->jwt_manager->validate_token( $token );
		
		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}
		
		return true;
	}
	
	/**
	 * Get JWT token from request
	 *
	 * @param WP_REST_Request $request Request object
	 * @return string|false Token or false if not found
	 */
	protected function get_token_from_request( $request ) {
		// Check Authorization header
		$auth_header = $request->get_header( 'Authorization' );
		if ( $auth_header && preg_match( '/Bearer\s+(.*)$/i', $auth_header, $matches ) ) {
			return $matches[1];
		}
		
		// Check query parameter
		$token = $request->get_param( 'token' );
		if ( $token ) {
			return $token;
		}
		
		return false;
	}
	
	/**
	 * Check rate limit
	 *
	 * @param WP_REST_Request $request Request object
	 * @return bool|WP_Error
	 */
	protected function check_rate_limit( $request ) {
		$user_id = get_current_user_id();
		$ip_address = $this->get_client_ip( $request );
		
		if ( ! $this->rate_limiter->is_allowed( $user_id, $ip_address ) ) {
			return new WP_Error(
				'rest_rate_limit_exceeded',
				__( 'Rate limit exceeded. Please try again later.', 'akf-learning-dashboard' ),
				array( 'status' => 429 )
			);
		}
		
		return true;
	}
	
	/**
	 * Get client IP address
	 *
	 * @param WP_REST_Request $request Request object
	 * @return string IP address
	 */
	protected function get_client_ip( $request ) {
		$ip_keys = array(
			'HTTP_CF_CONNECTING_IP', // Cloudflare
			'HTTP_X_REAL_IP',
			'HTTP_X_FORWARDED_FOR',
			'REMOTE_ADDR',
		);
		
		foreach ( $ip_keys as $key ) {
			if ( ! empty( $_SERVER[ $key ] ) ) {
				$ip = $_SERVER[ $key ];
				// Handle comma-separated IPs (X-Forwarded-For)
				if ( strpos( $ip, ',' ) !== false ) {
					$ip = trim( explode( ',', $ip )[0] );
				}
				return filter_var( $ip, FILTER_VALIDATE_IP ) ? $ip : '0.0.0.0';
			}
		}
		
		return '0.0.0.0';
	}
	
	/**
	 * Prepare error response
	 *
	 * @param string $code Error code
	 * @param string $message Error message
	 * @param int $status HTTP status code
	 * @return WP_REST_Response
	 */
	protected function error_response( $code, $message, $status = 400 ) {
		return new WP_REST_Response(
			array(
				'code' => $code,
				'message' => $message,
				'data' => array( 'status' => $status ),
			),
			$status
		);
	}
	
	/**
	 * Prepare success response
	 *
	 * @param mixed $data Response data
	 * @param int $status HTTP status code
	 * @return WP_REST_Response
	 */
	protected function success_response( $data, $status = 200 ) {
		return new WP_REST_Response( $data, $status );
	}
}

