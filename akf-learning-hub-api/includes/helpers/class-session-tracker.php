<?php
/**
 * Session Tracker Helper
 * Tracks user login sessions
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Session Tracker class
 */
class AKF_Session_Tracker {
	
	/**
	 * Initialize session tracking
	 */
	public static function init() {
		add_action( 'wp_login', array( __CLASS__, 'track_user_login_session' ), 10, 2 );
	}
	
	/**
	 * Track login sessions (hook into WordPress login)
	 *
	 * @param string $user_login User login name
	 * @param WP_User $user User object
	 */
	public static function track_user_login_session( $user_login, $user ) {
		$user_id = $user->ID;
		$sessions = get_user_meta( $user_id, 'akf_login_sessions', true );
		
		if ( ! is_array( $sessions ) ) {
			$sessions = array();
		}
		
		// Get current session token
		$session_manager = WP_Session_Tokens::get_instance( $user_id );
		$token = wp_get_session_token();
		
		// Detect device info
		$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : '';
		$device = self::detect_device_from_user_agent( $user_agent );
		$device_type = self::detect_device_type_from_user_agent( $user_agent );
		$ip_address = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : 'Unknown';
		
		// Create session entry
		$session_id = wp_generate_password( 32, false );
		$sessions[ $session_id ] = array(
			'token' => $token,
			'device' => $device,
			'deviceType' => $device_type,
			'ipAddress' => $ip_address,
			'lastActive' => current_time( 'mysql' ),
			'created' => current_time( 'mysql' ),
		);
		
		// Keep only last 10 sessions
		if ( count( $sessions ) > 10 ) {
			// Remove oldest sessions
			uasort( $sessions, function( $a, $b ) {
				return strtotime( $a['created'] ) - strtotime( $b['created'] );
			} );
			$sessions = array_slice( $sessions, -10, 10, true );
		}
		
		update_user_meta( $user_id, 'akf_login_sessions', $sessions );
	}
	
	/**
	 * Detect device from user agent
	 *
	 * @param string $user_agent User agent string
	 * @return string Device description
	 */
	public static function detect_device_from_user_agent( $user_agent ) {
		if ( stripos( $user_agent, 'Chrome' ) !== false ) {
			$os = 'Windows';
			if ( stripos( $user_agent, 'Mac' ) !== false ) {
				$os = 'Mac';
			}
			if ( stripos( $user_agent, 'Linux' ) !== false ) {
				$os = 'Linux';
			}
			return "Chrome on $os";
		} elseif ( stripos( $user_agent, 'Safari' ) !== false && stripos( $user_agent, 'Chrome' ) === false ) {
			if ( stripos( $user_agent, 'iPhone' ) !== false || stripos( $user_agent, 'iPad' ) !== false ) {
				$device = stripos( $user_agent, 'iPhone' ) !== false ? 'iPhone' : 'iPad';
				return "Safari on $device";
			}
			return "Safari on Mac";
		} elseif ( stripos( $user_agent, 'Firefox' ) !== false ) {
			$os = 'Windows';
			if ( stripos( $user_agent, 'Mac' ) !== false ) {
				$os = 'Mac';
			}
			if ( stripos( $user_agent, 'Linux' ) !== false ) {
				$os = 'Linux';
			}
			return "Firefox on $os";
		} elseif ( stripos( $user_agent, 'Edge' ) !== false ) {
			return "Edge on Windows";
		}
		
		return 'Unknown Device';
	}
	
	/**
	 * Detect device type from user agent
	 *
	 * @param string $user_agent User agent string
	 * @return string Device type (mobile or desktop)
	 */
	public static function detect_device_type_from_user_agent( $user_agent ) {
		if ( stripos( $user_agent, 'Mobile' ) !== false || 
			stripos( $user_agent, 'iPhone' ) !== false || 
			stripos( $user_agent, 'Android' ) !== false ) {
			return 'mobile';
		}
		return 'desktop';
	}
}

// Create global helper functions for backward compatibility
if ( ! function_exists( 'detect_device_from_user_agent' ) ) {
	/**
	 * Detect device from user agent
	 *
	 * @param string $user_agent User agent string
	 * @return string Device description
	 */
	function detect_device_from_user_agent( $user_agent ) {
		return AKF_Session_Tracker::detect_device_from_user_agent( $user_agent );
	}
}

if ( ! function_exists( 'detect_device_type_from_user_agent' ) ) {
	/**
	 * Detect device type from user agent
	 *
	 * @param string $user_agent User agent string
	 * @return string Device type
	 */
	function detect_device_type_from_user_agent( $user_agent ) {
		return AKF_Session_Tracker::detect_device_type_from_user_agent( $user_agent );
	}
}

