<?php
/**
 * Utilities Helper class
 * 
 * TODO: Migrate utility functions from functions.php
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Utilities Helper class
 */
class AKF_Utilities {
	
	/**
	 * Sanitize and validate data
	 *
	 * @param mixed $data Data to sanitize
	 * @return mixed Sanitized data
	 */
	public static function sanitize_data( $data ) {
		// TODO: Migrate from functions.php
		return $data;
	}
	
	/**
	 * Format API response
	 *
	 * @param mixed $data Response data
	 * @param bool $success Success status
	 * @return array Formatted response
	 */
	public static function format_response( $data, $success = true ) {
		// TODO: Migrate from functions.php
		return array(
			'success' => $success,
			'data' => $data,
		);
	}
}

