<?php
/**
 * JWT Manager class
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * JWT Manager class
 */
class AKF_JWT_Manager {
	
	/**
	 * Single instance
	 *
	 * @var AKF_JWT_Manager
	 */
	private static $instance = null;
	
	/**
	 * Secret key
	 *
	 * @var string|null
	 */
	private static $secret_key = null;
	
	/**
	 * Algorithm
	 *
	 * @var string
	 */
	private static $algorithm = 'sha256';
	
	/**
	 * Get instance
	 *
	 * @return AKF_JWT_Manager
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
	 * Get or generate JWT secret key
	 *
	 * @return string
	 */
	private static function get_secret_key() {
		if ( self::$secret_key !== null ) {
			return self::$secret_key;
		}
		
		if ( defined( 'AUTH_KEY' ) && defined( 'SECURE_AUTH_KEY' ) ) {
			self::$secret_key = hash( 'sha256', AUTH_KEY . SECURE_AUTH_KEY );
		} else {
			$secret = get_option( 'akf_jwt_secret_key' );
			if ( ! $secret ) {
				$secret = bin2hex( random_bytes( 32 ) );
				update_option( 'akf_jwt_secret_key', $secret );
			}
			self::$secret_key = $secret;
		}
		
		return self::$secret_key;
	}
	
	/**
	 * Base64 URL encode
	 *
	 * @param string $data Data to encode
	 * @return string
	 */
	private static function base64url_encode( $data ) {
		return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
	}
	
	/**
	 * Base64 URL decode
	 *
	 * @param string $data Data to decode
	 * @return string|false
	 */
	private static function base64url_decode( $data ) {
		$remainder = strlen( $data ) % 4;
		if ( $remainder ) {
			$data .= str_repeat( '=', 4 - $remainder );
		}
		return base64_decode( strtr( $data, '-_', '+/' ) );
	}
	
	/**
	 * Generate JWT token for user
	 *
	 * @param WP_User $user User object
	 * @param int|null $expiration Expiration timestamp
	 * @return string|false Token or false on failure
	 */
	public static function generate_token( $user, $expiration = null ) {
		if ( ! $user || ! $user->ID ) {
			self::log_error( 'Token generation failed: Invalid user' );
			return false;
		}
		
		$issued_at = time();
		$not_before = $issued_at;
		$expire = $expiration ?? ( $issued_at + ( HOUR_IN_SECONDS * 2 ) ); // 2 hours
		
		// Generate unique token ID for revocation support
		$token_id = bin2hex( random_bytes( 16 ) );
		
		$header = array(
			'typ' => 'JWT',
			'alg' => 'HS256',
		);
		
		$payload = array(
			'iss' => get_bloginfo( 'url' ),
			'aud' => get_bloginfo( 'url' ),
			'iat' => $issued_at,
			'nbf' => $not_before,
			'exp' => $expire,
			'jti' => $token_id,
			'data' => array(
				'user' => array(
					'id' => $user->ID,
					'email' => $user->user_email,
					'username' => $user->user_login,
					'display_name' => $user->display_name,
					'roles' => $user->roles,
				),
			),
		);
		
		$header_encoded = self::base64url_encode( json_encode( $header ) );
		$payload_encoded = self::base64url_encode( json_encode( $payload ) );
		
		$signature = hash_hmac(
			self::$algorithm,
			$header_encoded . '.' . $payload_encoded,
			self::get_secret_key(),
			true
		);
		$signature_encoded = self::base64url_encode( $signature );
		
		$jwt = $header_encoded . '.' . $payload_encoded . '.' . $signature_encoded;
		
		// Store token ID for revocation support
		self::store_token_id( $user->ID, $token_id, $expire );
		
		self::log_info( "JWT generated for user {$user->ID} (expires: " . date( 'Y-m-d H:i:s', $expire ) . ')' );
		
		return $jwt;
	}
	
	/**
	 * Verify and decode JWT token
	 *
	 * @param string $token JWT token
	 * @return array|false Payload or false on failure
	 */
	public static function verify_token( $token ) {
		if ( empty( $token ) ) {
			self::log_error( 'Token verification failed: Empty token' );
			return false;
		}
		
		$parts = explode( '.', $token );
		if ( count( $parts ) !== 3 ) {
			self::log_error( 'Token verification failed: Invalid format' );
			return false;
		}
		
		list( $header_encoded, $payload_encoded, $signature_encoded ) = $parts;
		
		$signature = self::base64url_decode( $signature_encoded );
		if ( $signature === false ) {
			self::log_error( 'Token verification failed: Invalid signature encoding' );
			return false;
		}
		
		// Timing-attack safe signature verification
		$expected_signature = hash_hmac(
			self::$algorithm,
			$header_encoded . '.' . $payload_encoded,
			self::get_secret_key(),
			true
		);
		
		if ( ! hash_equals( $expected_signature, $signature ) ) {
			self::log_error( 'Token verification failed: Signature mismatch' );
			return false;
		}
		
		$payload = json_decode( self::base64url_decode( $payload_encoded ), true );
		
		if ( ! $payload ) {
			self::log_error( 'Token verification failed: Invalid payload' );
			return false;
		}
		
		$current_time = time();
		
		// Check expiration
		if ( isset( $payload['exp'] ) && $payload['exp'] < $current_time ) {
			self::log_error( 'Token verification failed: Expired token' );
			return false;
		}
		
		// Check not-before
		if ( isset( $payload['nbf'] ) && $payload['nbf'] > $current_time ) {
			self::log_error( 'Token verification failed: Token not yet valid' );
			return false;
		}
		
		// Check issuer
		if ( isset( $payload['iss'] ) && $payload['iss'] !== get_bloginfo( 'url' ) ) {
			self::log_error( 'Token verification failed: Invalid issuer' );
			return false;
		}
		
		// Check if token is revoked
		if ( isset( $payload['jti'] ) && isset( $payload['data']['user']['id'] ) ) {
			if ( self::is_token_revoked( $payload['data']['user']['id'], $payload['jti'] ) ) {
				self::log_error( 'Token verification failed: Token revoked (user: ' . $payload['data']['user']['id'] . ')' );
				return false;
			}
		}
		
		return $payload;
	}
	
	/**
	 * Store token ID for revocation support
	 *
	 * @param int $user_id User ID
	 * @param string $token_id Token ID
	 * @param int $expiration Expiration timestamp
	 */
	private static function store_token_id( $user_id, $token_id, $expiration ) {
		$tokens = get_user_meta( $user_id, 'akf_active_jwt_tokens', true );
		if ( ! is_array( $tokens ) ) {
			$tokens = array();
		}
		
		// Clean up expired tokens
		$tokens = array_filter( $tokens, function( $token ) {
			return $token['exp'] > time();
		} );
		
		$tokens[ $token_id ] = array(
			'exp' => $expiration,
			'created' => time(),
			'ip' => isset( $_SERVER['REMOTE_ADDR'] ) ? $_SERVER['REMOTE_ADDR'] : 'unknown',
			'user_agent' => isset( $_SERVER['HTTP_USER_AGENT'] ) ? $_SERVER['HTTP_USER_AGENT'] : 'unknown',
		);
		
		// Keep only last 10 tokens per user
		if ( count( $tokens ) > 10 ) {
			uasort( $tokens, function( $a, $b ) {
				return $a['created'] - $b['created'];
			} );
			$tokens = array_slice( $tokens, -10, 10, true );
		}
		
		update_user_meta( $user_id, 'akf_active_jwt_tokens', $tokens );
	}
	
	/**
	 * Check if token is revoked
	 *
	 * @param int $user_id User ID
	 * @param string $token_id Token ID
	 * @return bool
	 */
	private static function is_token_revoked( $user_id, $token_id ) {
		$tokens = get_user_meta( $user_id, 'akf_active_jwt_tokens', true );
		if ( ! is_array( $tokens ) ) {
			return true;
		}
		
		return ! isset( $tokens[ $token_id ] );
	}
	
	/**
	 * Revoke a specific token
	 *
	 * @param int $user_id User ID
	 * @param string $token_id Token ID
	 * @return bool
	 */
	public static function revoke_token( $user_id, $token_id ) {
		$tokens = get_user_meta( $user_id, 'akf_active_jwt_tokens', true );
		if ( ! is_array( $tokens ) ) {
			return false;
		}
		
		if ( isset( $tokens[ $token_id ] ) ) {
			unset( $tokens[ $token_id ] );
			update_user_meta( $user_id, 'akf_active_jwt_tokens', $tokens );
			self::log_info( "Token revoked for user {$user_id}: {$token_id}" );
			return true;
		}
		
		return false;
	}
	
	/**
	 * Revoke all tokens for a user
	 *
	 * @param int $user_id User ID
	 * @return bool
	 */
	public static function revoke_all_tokens( $user_id ) {
		$result = delete_user_meta( $user_id, 'akf_active_jwt_tokens' );
		self::log_info( "All tokens revoked for user {$user_id}" );
		return $result;
	}
	
	/**
	 * Extract token from Authorization header
	 *
	 * @return string|false Token or false if not found
	 */
	public static function get_token_from_header() {
		$auth_header = isset( $_SERVER['HTTP_AUTHORIZATION'] ) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
		
		if ( empty( $auth_header ) ) {
			$auth_header = isset( $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ) ? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] : '';
		}
		
		if ( empty( $auth_header ) ) {
			return false;
		}
		
		list( $type, $token ) = array_pad( explode( ' ', $auth_header, 2 ), 2, null );
		
		if ( strcasecmp( $type, 'Bearer' ) !== 0 || empty( $token ) ) {
			return false;
		}
		
		return $token;
	}
	
	/**
	 * Validate token and return user ID
	 *
	 * @param string $token JWT token
	 * @return int|WP_Error User ID or error
	 */
	public function validate_token( $token ) {
		$payload = self::verify_token( $token );
		
		if ( ! $payload ) {
			return new WP_Error(
				'invalid_token',
				__( 'Invalid or expired token.', 'akf-learning-dashboard' ),
				array( 'status' => 401 )
			);
		}
		
		if ( ! isset( $payload['data']['user']['id'] ) ) {
			return new WP_Error(
				'invalid_token',
				__( 'Token missing user data.', 'akf-learning-dashboard' ),
				array( 'status' => 401 )
			);
		}
		
		return intval( $payload['data']['user']['id'] );
	}
	
	/**
	 * Log error message
	 *
	 * @param string $message Error message
	 */
	private static function log_error( $message ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[JWT_Manager ERROR] ' . $message );
		}
	}
	
	/**
	 * Log info message
	 *
	 * @param string $message Info message
	 */
	private static function log_info( $message ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[JWT_Manager INFO] ' . $message );
		}
	}
}

