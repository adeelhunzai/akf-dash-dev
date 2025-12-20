<?php
/**
 * SSO Endpoint class
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * SSO Endpoint class
 */
class AKF_SSO_Endpoint {
	
	/**
	 * Register SSO endpoints
	 */
	public static function register() {
		register_rest_route( 'custom-api/v1', '/auth/generate-sso-token', array(
			'methods'  => 'POST',
			'callback' => array( __CLASS__, 'generate_sso_token' ),
			'permission_callback' => 'is_user_logged_in',
		) );
		
		register_rest_route( 'custom-api/v1', '/auth/exchange-token', array(
			'methods'  => 'POST',
			'callback' => array( __CLASS__, 'exchange_token' ),
			'permission_callback' => '__return_true',
		) );
		
		register_rest_route( 'custom-api/v1', '/auth/validate', array(
			'methods'  => 'POST',
			'callback' => array( __CLASS__, 'validate_token' ),
			'permission_callback' => '__return_true',
		) );
		
		register_rest_route( 'custom-api/v1', '/auth/refresh', array(
			'methods'  => 'POST',
			'callback' => array( __CLASS__, 'refresh_token' ),
			'permission_callback' => '__return_true',
		) );
		
		register_rest_route( 'custom-api/v1', '/auth/revoke', array(
			'methods'  => 'POST',
			'callback' => array( __CLASS__, 'revoke_token' ),
			'permission_callback' => '__return_true',
		) );
	}
	
	/**
	 * Generate one-time SSO token
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error
	 */
	public static function generate_sso_token( $request ) {
		$user_id = get_current_user_id();
		
		if ( ! $user_id ) {
			self::log_error( 'SSO token generation failed: User not logged in' );
			return new WP_Error( 'unauthorized', 'User not logged in', array( 'status' => 401 ) );
		}
		
		// Rate limiting
		$rate_check = AKF_Rate_Limiter::check( $user_id, 'sso_generate', 10, 300 );
		if ( ! $rate_check['allowed'] ) {
			self::log_error( "SSO token generation rate limited for user {$user_id}" );
			return new WP_Error( 'rate_limit_exceeded', 'Too many requests. Please try again later.', array(
				'status' => 429,
				'reset_at' => $rate_check['reset_at'],
			) );
		}
		
		$token = bin2hex( random_bytes( 32 ) );
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
		$user_agent = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : 'unknown';
		
		set_transient( 'sso_token_' . $token, array(
			'user_id' => $user_id,
			'created_at' => time(),
			'ip' => $ip,
			'user_agent' => $user_agent,
		), 60 );
		
		self::log_info( "SSO token generated for user {$user_id} from IP {$ip}" );
		
		return rest_ensure_response( array(
			'success' => true,
			'token' => $token,
			'expires_in' => 60,
		) );
	}
	
	/**
	 * Exchange one-time SSO token for JWT
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error
	 */
	public static function exchange_token( $request ) {
		$token = $request->get_param( 'token' );
		
		if ( ! $token ) {
			self::log_error( 'Token exchange failed: Missing token' );
			return new WP_Error( 'missing_token', 'Token is required', array( 'status' => 400 ) );
		}
		
		$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
		
		// Rate limiting by IP - only check failures (20 failed attempts per 5 minutes)
		$rate_check = AKF_Rate_Limiter::check_failures_only( $ip, 'sso_exchange_fail', 20, 300 );
		if ( ! $rate_check['allowed'] ) {
			self::log_error( "Token exchange rate limited from IP {$ip}" );
			return new WP_Error( 'rate_limit_exceeded', 'Too many failed attempts. Please try again later.', array(
				'status' => 429,
				'reset_at' => $rate_check['reset_at'],
			) );
		}
		
		$transient_key = 'sso_token_' . $token;
		$token_data = get_transient( $transient_key );
		
		if ( ! $token_data ) {
			// Count this as a failed attempt
			AKF_Rate_Limiter::record_failure( $ip, 'sso_exchange_fail', 300 );
			self::log_error( "Token exchange failed: Invalid or expired token from IP {$ip}" );
			return new WP_Error( 'invalid_token', 'Token is invalid or expired', array( 'status' => 401 ) );
		}
		
		delete_transient( $transient_key );
		
		// Security validation (relaxed for cross-origin SSO)
		// Note: IP and User-Agent validation are disabled because:
		// 1. Token is generated on WordPress server but exchanged from Next.js app (different IPs)
		// 2. User-Agent may differ between WordPress page and API call context
		// Security is maintained through:
		// - One-time token (deleted after use)
		// - Short expiration (60 seconds)
		// - Rate limiting
		// - Token validation
		
		// Log for debugging (but don't block)
		$current_ip = isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : '';
		$current_ua = isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : '';
		
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			if ( $token_data['ip'] !== $current_ip ) {
				error_log( "[SSO] IP changed during token exchange. Original: {$token_data['ip']}, Current: {$current_ip}" );
			}
			if ( $token_data['user_agent'] !== $current_ua ) {
				error_log( "[SSO] User-Agent changed during token exchange. Original: {$token_data['user_agent']}, Current: {$current_ua}" );
			}
		}
		
		$user = get_user_by( 'ID', $token_data['user_id'] );
		
		if ( ! $user ) {
			self::log_error( "Token exchange failed: User {$token_data['user_id']} not found" );
			return new WP_Error( 'user_not_found', 'User not found', array( 'status' => 404 ) );
		}
		
		$jwt_token = AKF_JWT_Manager::generate_token( $user, time() + ( HOUR_IN_SECONDS * 2 ) );
		
		if ( ! $jwt_token ) {
			self::log_error( "Token exchange failed: JWT generation failed for user {$user->ID}" );
			return new WP_Error( 'token_generation_failed', 'Failed to generate JWT', array( 'status' => 500 ) );
		}
		
		self::log_info( "JWT issued to user {$user->ID} from IP {$ip}" );
		
		// Reset failure counter on successful exchange
		AKF_Rate_Limiter::reset( $ip, 'sso_exchange_fail' );
		
		// Get custom profile picture if available, otherwise use default avatar
		$custom_profile_picture = get_user_meta( $user->ID, 'akf_profile_picture', true );
		$avatar_url = ! empty( $custom_profile_picture ) ? $custom_profile_picture : get_avatar_url( $user->ID, array( 'size' => 96 ) );
		
		return rest_ensure_response( array(
			'success' => true,
			'token' => $jwt_token,
			'expires_in' => HOUR_IN_SECONDS * 2,
			'wordpress_url' => home_url(),
			'user' => array(
				'id' => $user->ID,
				'email' => $user->user_email,
				'display_name' => $user->display_name,
				'roles' => $user->roles,
				'avatar_url' => $avatar_url,
			),
		) );
	}
	
	/**
	 * Validate JWT token
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error
	 */
	public static function validate_token( $request ) {
		$token = $request->get_param( 'token' );
		
		if ( ! $token ) {
			$token = AKF_JWT_Manager::get_token_from_header();
		}
		
		if ( ! $token ) {
			self::log_error( 'Token validation failed: Missing token' );
			return new WP_Error( 'missing_token', 'Token is required', array( 'status' => 400 ) );
		}
		
		$payload = AKF_JWT_Manager::verify_token( $token );
		
		if ( ! $payload ) {
			self::log_error( 'Token validation failed: Invalid token' );
			return new WP_Error( 'invalid_token', 'Invalid or expired token', array( 'status' => 401 ) );
		}
		
		$user_id = $payload['data']['user']['id'];
		$user = get_user_by( 'ID', $user_id );
		
		if ( ! $user ) {
			self::log_error( "Token validation failed: User {$user_id} not found" );
			return new WP_Error( 'user_not_found', 'User not found', array( 'status' => 404 ) );
		}
		
		// Get custom profile picture if available, otherwise use default avatar
		$custom_profile_picture = get_user_meta( $user->ID, 'akf_profile_picture', true );
		$avatar_url = ! empty( $custom_profile_picture ) ? $custom_profile_picture : get_avatar_url( $user->ID, array( 'size' => 96 ) );
		
		return rest_ensure_response( array(
			'success' => true,
			'valid' => true,
			'wordpress_url' => home_url(),
			'user' => array(
				'id' => $user->ID,
				'email' => $user->user_email,
				'display_name' => $user->display_name,
				'roles' => $user->roles,
				'avatar_url' => $avatar_url,
			),
		) );
	}
	
	/**
	 * Refresh JWT token
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error
	 */
	public static function refresh_token( $request ) {
		$token = $request->get_param( 'token' );
		
		if ( ! $token ) {
			$token = AKF_JWT_Manager::get_token_from_header();
		}
		
		if ( ! $token ) {
			self::log_error( 'Token refresh failed: Missing token' );
			return new WP_Error( 'missing_token', 'Token is required', array( 'status' => 400 ) );
		}
		
		$payload = AKF_JWT_Manager::verify_token( $token );
		
		if ( ! $payload ) {
			self::log_error( 'Token refresh failed: Invalid token' );
			return new WP_Error( 'invalid_token', 'Invalid or expired token', array( 'status' => 401 ) );
		}
		
		$user_id = $payload['data']['user']['id'];
		$user = get_user_by( 'ID', $user_id );
		
		if ( ! $user ) {
			self::log_error( "Token refresh failed: User {$user_id} not found" );
			return new WP_Error( 'user_not_found', 'User not found', array( 'status' => 404 ) );
		}
		
		$new_token = AKF_JWT_Manager::generate_token( $user, HOUR_IN_SECONDS * 2 );
		
		if ( ! $new_token ) {
			self::log_error( "Token refresh failed: JWT generation failed for user {$user->ID}" );
			return new WP_Error( 'token_generation_failed', 'Failed to generate new token', array( 'status' => 500 ) );
		}
		
		if ( isset( $payload['jti'] ) ) {
			AKF_JWT_Manager::revoke_token( $user_id, $payload['jti'] );
		}
		
		self::log_info( "Token refreshed for user {$user->ID}" );
		
		return rest_ensure_response( array(
			'success' => true,
			'token' => $new_token,
			'expires_in' => HOUR_IN_SECONDS * 2,
		) );
	}
	
	/**
	 * Revoke JWT token
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response|WP_Error
	 */
	public static function revoke_token( $request ) {
		$token = $request->get_param( 'token' );
		
		if ( ! $token ) {
			$token = AKF_JWT_Manager::get_token_from_header();
		}
		
		if ( ! $token ) {
			return new WP_Error( 'missing_token', 'Token is required', array( 'status' => 400 ) );
		}
		
		$payload = AKF_JWT_Manager::verify_token( $token );
		
		if ( ! $payload ) {
			return new WP_Error( 'invalid_token', 'Invalid token', array( 'status' => 401 ) );
		}
		
		$user_id = $payload['data']['user']['id'];
		$token_id = isset( $payload['jti'] ) ? $payload['jti'] : null;
		
		if ( $token_id ) {
			AKF_JWT_Manager::revoke_token( $user_id, $token_id );
		}
		
		self::log_info( "Token revoked for user {$user_id}" );
		
		return rest_ensure_response( array(
			'success' => true,
			'message' => 'Token revoked successfully',
		) );
	}
	
	/**
	 * Log error message
	 *
	 * @param string $message Error message
	 */
	private static function log_error( $message ) {
		error_log( '[SSO_Endpoint ERROR] ' . $message );
	}
	
	/**
	 * Log info message
	 *
	 * @param string $message Info message
	 */
	private static function log_info( $message ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[SSO_Endpoint INFO] ' . $message );
		}
	}
}

