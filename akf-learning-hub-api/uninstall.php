<?php
/**
 * Uninstall script for AKF Learning Dashboard plugin
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if uninstall not called from WordPress
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Delete plugin options
delete_option( 'akf_learning_dashboard_version' );

// Delete transients
// Add any transients you want to clean up here

// Flush rewrite rules
flush_rewrite_rules();

