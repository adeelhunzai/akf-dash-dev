<?php
/**
 * Authentication Helper functions
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Authentication Helper class
 */
class AKF_Authentication {
	
	/**
	 * Check if user is authenticated via JWT or WordPress session
	 *
	 * @return bool
	 */
	public static function is_authenticated_user() {
		// Check JWT token first
		$token = AKF_JWT_Manager::get_token_from_header();
		
		if ( $token ) {
			$payload = AKF_JWT_Manager::verify_token( $token );
			return $payload !== false;
		}
		
		// Fallback to WordPress session
		return is_user_logged_in();
	}
	
	/**
	 * Check if user is authenticated via JWT or WordPress session and is an administrator
	 *
	 * @return bool
	 */
	public static function is_admin_user() {
		// Check JWT token first
		$token = AKF_JWT_Manager::get_token_from_header();
		
		if ( $token ) {
			$payload = AKF_JWT_Manager::verify_token( $token );
			
			if ( $payload && isset( $payload['data']['user']['roles'] ) ) {
				$roles = $payload['data']['user']['roles'];
				// Check if user has administrator role
				if ( in_array( 'administrator', $roles ) ) {
					return true;
				}
			}
			
			// If token verification failed or user doesn't have admin role,
			// fall through to WordPress session check
		}
		
		// Fallback to WordPress session
		return current_user_can( 'administrator' );
	}
	
	/**
	 * Get current user from JWT or WordPress session
	 * Returns user object or false
	 *
	 * @return WP_User|false
	 */
	public static function get_current_auth_user() {
		// Check JWT token first
		$token = AKF_JWT_Manager::get_token_from_header();
		
		if ( $token ) {
			$payload = AKF_JWT_Manager::verify_token( $token );
			
			if ( $payload && isset( $payload['data']['user']['id'] ) ) {
				$user_id = $payload['data']['user']['id'];
				return get_userdata( $user_id );
			}
		}
		
		// Fallback to WordPress session
		if ( is_user_logged_in() ) {
			return wp_get_current_user();
		}
		
		return false;
	}
	
	/**
	 * Authenticate user from JWT token and set as current user
	 * This allows WordPress functions like get_current_user_id() and current_user_can() to work with JWT
	 * Returns user ID if authenticated, false otherwise
	 *
	 * @return int|false User ID or false
	 */
	public static function authenticate_and_set_current_user() {
		// Check JWT token first
		$token = AKF_JWT_Manager::get_token_from_header();
		
		if ( $token ) {
			$payload = AKF_JWT_Manager::verify_token( $token );
			
			if ( $payload && isset( $payload['data']['user']['id'] ) ) {
				$user_id = $payload['data']['user']['id'];
				$user = get_userdata( $user_id );
				
				if ( $user ) {
					// Set the current user so WordPress functions work
					wp_set_current_user( $user_id );
					return $user_id;
				}
			}
		}
		
		// Fallback to WordPress session
		if ( is_user_logged_in() ) {
			return get_current_user_id();
		}
		
		return false;
	}
}

// Create global helper functions for backward compatibility
if ( ! function_exists( 'is_authenticated_user' ) ) {
	/**
	 * Check if user is authenticated
	 *
	 * @return bool
	 */
	function is_authenticated_user() {
		return AKF_Authentication::is_authenticated_user();
	}
}

if ( ! function_exists( 'is_admin_user' ) ) {
	/**
	 * Check if user is admin
	 *
	 * @return bool
	 */
	function is_admin_user() {
		return AKF_Authentication::is_admin_user();
	}
}

if ( ! function_exists( 'get_current_auth_user' ) ) {
	/**
	 * Get current authenticated user
	 *
	 * @return WP_User|false
	 */
	function get_current_auth_user() {
		return AKF_Authentication::get_current_auth_user();
	}
}

if ( ! function_exists( 'authenticate_and_set_current_user' ) ) {
	/**
	 * Authenticate and set current user
	 *
	 * @return int|false
	 */
	function authenticate_and_set_current_user() {
		return AKF_Authentication::authenticate_and_set_current_user();
	}
}

