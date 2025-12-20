<?php
/**
 * Autoloader for AKF Learning Dashboard plugin
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Autoloader class
 */
class AKF_Autoloader {
	
	/**
	 * Initialize the autoloader
	 */
	public static function init() {
		spl_autoload_register( array( __CLASS__, 'autoload' ) );
	}
	
	/**
	 * Autoload classes
	 *
	 * @param string $class_name Class name to load
	 */
	public static function autoload( $class_name ) {
		// Only handle our classes
		if ( strpos( $class_name, 'AKF_' ) !== 0 ) {
			return;
		}
		
		// Remove 'AKF_' prefix
		$class_name = str_replace( 'AKF_', '', $class_name );
		
		// Convert class name to file path
		$file_path = self::get_file_path( $class_name );
		
		if ( $file_path && file_exists( $file_path ) ) {
			require_once $file_path;
		}
	}
	
	/**
	 * Get file path for a class
	 *
	 * @param string $class_name Class name without prefix
	 * @return string|false File path or false if not found
	 */
	private static function get_file_path( $class_name ) {
		$base_dir = AKF_LEARNING_DASHBOARD_PLUGIN_DIR . 'includes/';
		
		// Convert class name to lowercase with underscores
		$class_name = strtolower( str_replace( '_', '-', $class_name ) );
		
		// Map class names to file paths
		$class_map = array(
			// Core classes
			'jwt-manager' => 'core/class-jwt-manager.php',
			'rate-limiter' => 'core/class-rate-limiter.php',
			'sso-endpoint' => 'core/class-sso-endpoint.php',
			'rest-controller' => 'core/class-rest-controller.php',
			
			// Dashboard controllers
			'admin-controller' => 'dashboards/admin/class-admin-controller.php',
			'manager-controller' => 'dashboards/manager/class-manager-controller.php',
			'facilitator-controller' => 'dashboards/facilitator/class-facilitator-controller.php',
			'learner-controller' => 'dashboards/learner/class-learner-controller.php',
			
			// Helper classes
			'authentication' => 'helpers/class-authentication.php',
			'session-tracker' => 'helpers/class-session-tracker.php',
			'image-upload' => 'helpers/class-image-upload.php',
			'permissions' => 'helpers/class-permissions.php',
			'utilities' => 'helpers/class-utilities.php',
			'role-mapper' => 'helpers/class-role-mapper.php',
			
			// Shortcodes
			'dashboard-link' => 'shortcodes/class-dashboard-link.php',
			
			// Admin classes
			'settings-page' => 'admin/class-settings-page.php',
		);
		
		if ( isset( $class_map[ $class_name ] ) ) {
			return $base_dir . $class_map[ $class_name ];
		}
		
		// Try to find file by convention
		// Check core directory
		$core_file = $base_dir . 'core/class-' . $class_name . '.php';
		if ( file_exists( $core_file ) ) {
			return $core_file;
		}
		
		// Check helpers directory
		$helper_file = $base_dir . 'helpers/class-' . $class_name . '.php';
		if ( file_exists( $helper_file ) ) {
			return $helper_file;
		}
		
		// Check admin directory
		$admin_file = $base_dir . 'admin/class-' . $class_name . '.php';
		if ( file_exists( $admin_file ) ) {
			return $admin_file;
		}
		
		// Check dashboards directories
		$dashboard_dirs = array( 'admin', 'manager', 'facilitator', 'learner' );
		foreach ( $dashboard_dirs as $dir ) {
			$dashboard_file = $base_dir . 'dashboards/' . $dir . '/class-' . $class_name . '.php';
			if ( file_exists( $dashboard_file ) ) {
				return $dashboard_file;
			}
		}
		
		return false;
	}
}

