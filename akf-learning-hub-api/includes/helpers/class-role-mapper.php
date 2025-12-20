<?php
/**
 * Role Mapper Helper class
 * 
 * TODO: Migrate role mapping functions from functions.php
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Role Mapper Helper class
 */
class AKF_Role_Mapper {
	
	/**
	 * Map WordPress role to API role
	 *
	 * @param string $wp_role WordPress role
	 * @return string|false API role or false
	 */
	public static function wp_to_api_role( $wp_role ) {
		// TODO: Migrate from functions.php
		return false;
	}
	
	/**
	 * Map API role to WordPress role
	 *
	 * @param string $api_role API role
	 * @return string|false WordPress role or false
	 */
	public static function api_to_wp_role( $api_role ) {
		// TODO: Migrate from functions.php
		return false;
	}
}

