<?php
/**
 * Dashboard Navigation Links
 *
 * Handle #dashboard-link-{path} placeholders in nav menu
 * Works with Nav Menu Roles plugin for role-based visibility
 * 
 * Role Mappings:
 * - Administrator = administrator
 * - Manager = group_leader_clone
 * - Facilitator = group_leader
 * - Learner = subscriber
 * 
 * Usage in Appearance → Menus:
 * - #dashboard-link-admin → redirects to /admin
 * - #dashboard-link-manager → redirects to /manager  
 * - #dashboard-link-facilitator → redirects to /facilitator
 * - #dashboard-link-learner → redirects to /learner
 * - #dashboard-link-settings → redirects to role-specific settings (dynamic)
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Dashboard Link class - handles nav menu placeholders for SSO dashboard links
 */
class AKF_Dashboard_Link {
	
	/**
	 * Initialize hooks
	 */
	public static function init() {
		add_filter( 'walker_nav_menu_start_el', array( __CLASS__, 'replace_dashboard_placeholders' ), 10, 4 );
		add_action( 'wp_footer', array( __CLASS__, 'output_sso_script' ), 999 );
	}
	
	/**
	 * Replace #dashboard-link-{path} placeholders in nav menu items
	 *
	 * @param string $item_output The menu item's starting HTML output.
	 * @param WP_Post $item Menu item data object.
	 * @param int $depth Depth of menu item.
	 * @param stdClass $args An object of wp_nav_menu() arguments.
	 * @return string Modified menu item output.
	 */
	public static function replace_dashboard_placeholders( $item_output, $item, $depth, $args ) {
		// Check if URL starts with #dashboard-link
		if ( strpos( $item->url, '#dashboard-link' ) !== 0 ) {
			return $item_output;
		}
		
		// Not logged in - redirect to login
		if ( ! is_user_logged_in() ) {
			return str_replace( 'href="' . $item->url . '"', 'href="' . esc_url( wp_login_url() ) . '"', $item_output );
		}
		
		// Extract the path from the placeholder
		$path = str_replace( '#dashboard-link-', '', $item->url );
		
		// Map paths to dashboard routes
		$path_map = array(
			'admin'       => '/admin',
			'manager'     => '/manager',
			'facilitator' => '/facilitator',
			'learner'     => '/learner',
		);
		
		// Handle dynamic settings path based on user role
		if ( $path === 'settings' ) {
			$dashboard_path = self::get_settings_path_for_user();
		} else {
			$dashboard_path = isset( $path_map[ $path ] ) ? $path_map[ $path ] : '/' . $path;
		}
		
		// Get dashboard base URL
		$dashboard_url = '';
		if ( class_exists( 'AKF_Settings_Page' ) && method_exists( 'AKF_Settings_Page', 'get_dashboard_url' ) ) {
			$dashboard_url = AKF_Settings_Page::get_dashboard_url();
		}
		
		if ( empty( $dashboard_url ) ) {
			return $item_output;
		}
		
		// Generate unique ID and nonce
		$unique_id = 'dashboard-nav-' . uniqid();
		$nonce = wp_create_nonce( 'wp_rest' );
		
		// Get existing classes from the menu item
		$existing_classes = '';
		if ( ! empty( $item->classes ) && is_array( $item->classes ) ) {
			$existing_classes = implode( ' ', array_filter( $item->classes ) );
		}
		
		// Build the SSO link
		$replacement = '<a ';
		$replacement .= 'id="' . esc_attr( $unique_id ) . '" ';
		$replacement .= 'href="#" ';
		$replacement .= 'class="dashboard-sso-nav-link ' . esc_attr( $existing_classes ) . '" ';
		$replacement .= 'data-dashboard-url="' . esc_attr( $dashboard_url ) . '" ';
		$replacement .= 'data-dashboard-path="' . esc_attr( $dashboard_path ) . '" ';
		$replacement .= 'data-nonce="' . esc_attr( $nonce ) . '"';
		
		// Preserve original attributes
		if ( ! empty( $item->attr_title ) ) {
			$replacement .= ' title="' . esc_attr( $item->attr_title ) . '"';
		}
		if ( ! empty( $item->target ) ) {
			$replacement .= ' target="' . esc_attr( $item->target ) . '"';
		}
		if ( ! empty( $item->xfn ) ) {
			$replacement .= ' rel="' . esc_attr( $item->xfn ) . '"';
		}
		
		$replacement .= '>';
		$replacement .= esc_html( $item->title );
		$replacement .= '</a>';
		
		// Replace the <a> tag
		$item_output = preg_replace( '/<a\b[^>]*>.*?<\/a>/is', $replacement, $item_output );
		
		return $item_output;
	}
	
	/**
	 * Get the appropriate settings path based on user's highest role
	 *
	 * @return string Settings path for the user's role
	 */
	public static function get_settings_path_for_user() {
		$user = wp_get_current_user();
		$roles = (array) $user->roles;
		
		if ( in_array( 'administrator', $roles, true ) ) {
			return '/admin/settings';
		}
		
		if ( in_array( 'group_leader_clone', $roles, true ) ) {
			return '/manager/settings';
		}
		
		if ( in_array( 'group_leader', $roles, true ) ) {
			return '/facilitator/settings';
		}
		
		return '/learner/settings';
	}
	
	/**
	 * Output SSO JavaScript for nav links
	 */
	public static function output_sso_script() {
		if ( ! is_user_logged_in() ) {
			return;
		}
		?>
		<script>
		(function() {
			function initDashboardLinks() {
				document.querySelectorAll('.dashboard-sso-nav-link').forEach(function(link) {
					if (link.dataset.ssoListenerAdded) return;
					link.dataset.ssoListenerAdded = 'true';
					
					link.addEventListener('click', async function(e) {
						e.preventDefault();
						e.stopPropagation();
						
						const dashboardUrl = this.getAttribute('data-dashboard-url');
						const dashboardPath = this.getAttribute('data-dashboard-path');
						const nonce = this.getAttribute('data-nonce');
						
						try {
							const response = await fetch('<?php echo esc_url( rest_url( 'custom-api/v1/auth/generate-sso-token' ) ); ?>', {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
									'X-WP-Nonce': nonce
								},
								credentials: 'include'
							});
							
							if (!response.ok) {
								const errorData = await response.json().catch(() => ({}));
								throw new Error(errorData.message || 'Token generation failed');
							}
							
							const data = await response.json();
							
							if (data.success && data.token) {
								const redirectUrl = dashboardUrl + '/auth/callback?sso_token=' + encodeURIComponent(data.token) + '&redirect=' + encodeURIComponent(dashboardPath);
								window.open(redirectUrl, '_blank');
							} else {
								throw new Error(data.message || 'Invalid response');
							}
							
						} catch (error) {
							console.error('Dashboard SSO Error:', error);
							alert('Unable to access dashboard. Please try again.');
						}
					});
				});
			}
			
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', initDashboardLinks);
			} else {
				initDashboardLinks();
			}
			
			if (typeof jQuery !== 'undefined') {
				jQuery(document).ajaxComplete(function() {
					setTimeout(initDashboardLinks, 100);
				});
			}
		})();
		</script>
		<?php
	}
}

