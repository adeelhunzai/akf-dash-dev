<?php
/**
 * Plugin Name: AKF Learning Dashboard API
 * Plugin URI: https://akflearninghub.org/
 * Description: REST API endpoints for AKF Learning Hub dashboards (Admin, Manager, Facilitator, Learner)
 * Version: 1.0.0
 * Author: Tech ALPHALOGIX Pvt. Ltd
 * Author URI: https://techalphalogix.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: akf-learning-dashboard
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Define plugin constants
define( 'AKF_LEARNING_DASHBOARD_VERSION', '1.0.1' );
define( 'AKF_LEARNING_DASHBOARD_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'AKF_LEARNING_DASHBOARD_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'AKF_LEARNING_DASHBOARD_PLUGIN_FILE', __FILE__ );

/**
 * Main plugin class
 */
class AKF_Learning_Dashboard {
	
	/**
	 * Single instance of the class
	 *
	 * @var AKF_Learning_Dashboard
	 */
	private static $instance = null;
	
	/**
	 * Get single instance
	 *
	 * @return AKF_Learning_Dashboard
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
		$this->load_dependencies();
		$this->init_hooks();
	}
	
	/**
	 * Load plugin dependencies
	 */
	private function load_dependencies() {
		// Load autoloader
		require_once AKF_LEARNING_DASHBOARD_PLUGIN_DIR . 'includes/class-autoloader.php';
		
		// Initialize autoloader
		AKF_Autoloader::init();
	}
	
	/**
	 * Initialize WordPress hooks
	 */
	private function init_hooks() {
		// Activation/Deactivation hooks
		register_activation_hook( __FILE__, array( $this, 'activate' ) );
		register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );
		
		// Initialize on plugins_loaded to ensure WordPress is ready
		add_action( 'plugins_loaded', array( $this, 'init' ), 10 );
	}
	
	/**
	 * Plugin activation
	 */
	public function activate() {
		// Check PHP version
		if ( version_compare( PHP_VERSION, '7.4', '<' ) ) {
			deactivate_plugins( plugin_basename( __FILE__ ) );
			wp_die( 
				esc_html__( 'AKF Learning Dashboard requires PHP 7.4 or higher.', 'akf-learning-dashboard' ),
				esc_html__( 'Plugin Activation Error', 'akf-learning-dashboard' ),
				array( 'back_link' => true )
			);
		}
		
		// Check WordPress version
		if ( version_compare( get_bloginfo( 'version' ), '5.8', '<' ) ) {
			deactivate_plugins( plugin_basename( __FILE__ ) );
			wp_die( 
				esc_html__( 'AKF Learning Dashboard requires WordPress 5.8 or higher.', 'akf-learning-dashboard' ),
				esc_html__( 'Plugin Activation Error', 'akf-learning-dashboard' ),
				array( 'back_link' => true )
			);
		}
		
		// Flush rewrite rules on activation
		flush_rewrite_rules();
	}
	
	/**
	 * Plugin deactivation
	 */
	public function deactivate() {
		// Flush rewrite rules on deactivation
		flush_rewrite_rules();
	}
	
	/**
	 * Initialize plugin components
	 */
	public function init() {
		// Authenticate WordPress REST API with JWT
		$this->init_jwt_authentication();
		
		// Load core classes
		$this->load_core();
		
		// Load dashboard controllers
		$this->load_dashboards();
		
		// Load helpers
		$this->load_helpers();
		
		// Load admin classes
		$this->load_admin();
		
		// Load shortcodes
		$this->load_shortcodes();
		
		// Initialize REST API routes
		$this->init_rest_routes();
		
		// Initialize CORS
		$this->init_cors();
		
		// Allow certificate access for course completers
		$this->init_certificate_access();
	}
	
	/**
	 * Initialize certificate access for API users
	 * Allows users who have completed a course to view their certificate
	 */
	private function init_certificate_access() {
		// Hook very early to set user context before LearnDash checks
		// Using priority 1 on 'init' to run before most other plugins
		add_action( 'init', array( $this, 'early_certificate_user_setup' ), 1 );
		
		// Also hook into 'wp' action which runs after query is parsed but before template
		add_action( 'wp', array( $this, 'early_certificate_user_setup' ), 1 );
		
		// Hook into template redirect with very early priority (LearnDash uses priority 10)
		add_action( 'template_redirect', array( $this, 'handle_certificate_page_access' ), 0 );
		
		// Log when certificate is disallowed for debugging
		add_action( 'learndash_certificate_disallowed', array( $this, 'handle_certificate_disallowed' ) );
	}
	
	/**
	 * Handle when LearnDash disallows certificate access
	 * Check if user should have access via API parameters
	 * Note: This action fires when access is denied, we log it for debugging
	 */
	public function handle_certificate_disallowed() {
		$course_id = isset( $_GET['course_id'] ) ? intval( $_GET['course_id'] ) : 0;
		$user_id = isset( $_GET['user'] ) ? intval( $_GET['user'] ) : 0;
		
		// Just log for debugging - don't try to override here as it causes issues
		error_log( 'AKF Certificate Disallowed: course_id=' . $course_id . ', user=' . $user_id );
	}
	
	/**
	 * Early setup of user context for certificate access
	 * Runs on 'init' hook before most other checks
	 * Handles signed certificate tokens from the API
	 */
	public function early_certificate_user_setup() {
		try {
			// Check if this looks like a certificate request
			$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '';
			
			if ( strpos( $request_uri, '/certificates/' ) === false ) {
				return;
			}
			
			// Check for signed certificate token (from API)
			$cert_token = isset( $_GET['cert_token'] ) ? sanitize_text_field( $_GET['cert_token'] ) : '';
			$course_id = isset( $_GET['course_id'] ) ? intval( $_GET['course_id'] ) : 0;
			
			if ( $cert_token && $course_id ) {
				// Verify the signed token
				$token_data = $this->verify_certificate_token( $cert_token );
				
				if ( $token_data && $token_data['course_id'] === $course_id ) {
					$user_id = $token_data['user_id'];
					
					// Set the user context
					wp_set_current_user( $user_id );
					
					error_log( 'AKF Certificate Token: Set user ' . $user_id . ' for course ' . $course_id );
					return;
				} else {
					error_log( 'AKF Certificate Token: Invalid or expired token' );
				}
			}
			
			// Fallback: Check for user parameter (legacy)
			$user_id = isset( $_GET['user'] ) ? intval( $_GET['user'] ) : 0;
			
			if ( ! $course_id || ! $user_id ) {
				return;
			}
			
			// Check if user exists
			$user = get_user_by( 'id', $user_id );
			if ( ! $user ) {
				error_log( 'AKF Early Certificate Setup: User ' . $user_id . ' not found' );
				return;
			}
			
			// Verify user completed the course
			global $wpdb;
			$activity_table = $wpdb->prefix . 'learndash_user_activity';
			
			// Check if table exists
			if ( $wpdb->get_var( "SHOW TABLES LIKE '{$activity_table}'" ) !== $activity_table ) {
				error_log( 'AKF Early Certificate Setup: Activity table not found' );
				return;
			}
			
			$completion = $wpdb->get_var( $wpdb->prepare( "
				SELECT activity_completed
				FROM {$activity_table}
				WHERE user_id = %d
				AND post_id = %d
				AND activity_type = 'course'
				AND activity_status = 1
			", $user_id, $course_id ) );
			
			if ( $completion ) {
				// Set the user context early
				wp_set_current_user( $user_id );
				
				error_log( 'AKF Early Certificate Setup: Set user ' . $user_id . ' for course ' . $course_id );
			} else {
				error_log( 'AKF Early Certificate Setup: User ' . $user_id . ' has not completed course ' . $course_id );
			}
		} catch ( Exception $e ) {
			error_log( 'AKF Early Certificate Setup Error: ' . $e->getMessage() );
		}
	}
	
	/**
	 * Verify a signed certificate access token
	 *
	 * @param string $token The token to verify
	 * @return array|false Array with user_id, course_id, cert_template_id or false if invalid
	 */
	private function verify_certificate_token( $token ) {
		$decoded = base64_decode( $token );
		if ( ! $decoded ) {
			return false;
		}

		$parts = explode( '|', $decoded );
		if ( count( $parts ) !== 5 ) {
			return false;
		}

		list( $user_id, $course_id, $cert_template_id, $expiry, $signature ) = $parts;

		// Check expiry
		if ( time() > intval( $expiry ) ) {
			error_log( 'AKF Certificate Token: Token expired' );
			return false;
		}

		// Verify signature
		$data = $user_id . '|' . $course_id . '|' . $cert_template_id . '|' . $expiry;
		$expected_signature = hash_hmac( 'sha256', $data, wp_salt( 'auth' ) );

		if ( ! hash_equals( $expected_signature, $signature ) ) {
			error_log( 'AKF Certificate Token: Invalid signature' );
			return false;
		}

		return array(
			'user_id' => intval( $user_id ),
			'course_id' => intval( $course_id ),
			'cert_template_id' => intval( $cert_template_id ),
		);
	}
	
	/**
	 * Handle certificate page access for API users
	 * Sets up the user context when accessing certificate pages
	 * Runs on template_redirect with priority 0 (before LearnDash's priority 10)
	 */
	public function handle_certificate_page_access() {
		try {
			// Check if this is a certificate page by URL or post type
			$is_certificate_page = is_singular( 'sfwd-certificates' );
			
			// Also check URL pattern for certificates
			$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '';
			if ( ! $is_certificate_page && strpos( $request_uri, '/certificates/' ) !== false ) {
				$is_certificate_page = true;
			}
			
			if ( ! $is_certificate_page ) {
				return;
			}
			
			$course_id = isset( $_GET['course_id'] ) ? intval( $_GET['course_id'] ) : 0;
			$user_id = isset( $_GET['user'] ) ? intval( $_GET['user'] ) : 0;
			
			if ( ! $course_id || ! $user_id ) {
				return;
			}
			
			// Skip if user is already set correctly
			if ( get_current_user_id() === $user_id ) {
				return;
			}
			
			// Verify user completed the course before allowing access
			global $wpdb;
			$activity_table = $wpdb->prefix . 'learndash_user_activity';
			
			$completion = $wpdb->get_var( $wpdb->prepare( "
				SELECT activity_completed
				FROM {$activity_table}
				WHERE user_id = %d
				AND post_id = %d
				AND activity_type = 'course'
				AND activity_status = 1
			", $user_id, $course_id ) );
			
			if ( $completion ) {
				// Set the user for certificate generation
				wp_set_current_user( $user_id );
				
				// Log for debugging
				error_log( 'AKF Template Redirect: Set user ' . $user_id . ' for course ' . $course_id );
			}
		} catch ( Exception $e ) {
			error_log( 'AKF Template Redirect Error: ' . $e->getMessage() );
		}
	}
	
	/**
	 * Initialize JWT authentication for WordPress REST API
	 */
	private function init_jwt_authentication() {
		// Authenticate WordPress core REST API endpoints with JWT tokens
		// This makes endpoints like /wp/v2/users/me work with JWT authentication
		add_filter( 'rest_authentication_errors', function( $result ) {
			// If authentication already succeeded, don't override it
			if ( ! empty( $result ) ) {
				return $result;
			}
			
			// Try to authenticate from JWT token
			$user_id = AKF_Authentication::authenticate_and_set_current_user();
			
			if ( $user_id ) {
				// Authentication successful, return null to allow the request
				return null;
			}
			
			// No authentication found, let WordPress handle it normally
			// (this allows cookie-based auth to still work)
			return $result;
		}, 20 );
		
		// Modify WordPress core user REST API response to include custom profile picture
		add_filter( 'rest_prepare_user', function( $response, $user, $request ) {
			// Only modify for /wp/v2/users/me endpoint
			if ( $request->get_route() === '/wp/v2/users/me' ) {
				// Get custom profile picture
				$custom_profile_picture = get_user_meta( $user->ID, 'akf_profile_picture', true );
				
				if ( ! empty( $custom_profile_picture ) ) {
					// Use custom profile picture for all avatar sizes
					$avatar_urls = array(
						'24' => $custom_profile_picture,
						'48' => $custom_profile_picture,
						'96' => $custom_profile_picture,
					);
					
					// Update the response data
					$data = $response->get_data();
					$data['avatar_urls'] = $avatar_urls;
					$response->set_data( $data );
				}
			}
			
			return $response;
		}, 10, 3 );
	}
	
	/**
	 * Initialize CORS headers
	 */
	private function init_cors() {
		add_action( 'rest_api_init', function() {
			remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
			add_filter( 'rest_pre_serve_request', function( $value ) {
				$origin = get_http_origin();
				
				// Get allowed origins from settings
				$allowed_origins = array();
				if ( class_exists( 'AKF_Settings_Page' ) ) {
					$allowed_origins = AKF_Settings_Page::get_allowed_origins();
				} else {
					// Fallback to defaults if settings page not loaded
					$allowed_origins = array(
						'https://akf-learning-dash-git-feat-auth-adeel-akhtars-projects.vercel.app',
						'http://localhost:3000',
						'http://localhost:3001',
					);
				}
				
				if ( $origin && in_array( $origin, $allowed_origins ) ) {
					header( 'Access-Control-Allow-Origin: ' . $origin );
					header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
					header( 'Access-Control-Allow-Credentials: true' );
					header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce' );
				}
				
				return $value;
			} );
		}, 15 );
	}
	
	/**
	 * Load core classes
	 */
	private function load_core() {
		// Core classes will be autoloaded when needed
		// But we can initialize singletons here if needed
	}
	
	/**
	 * Load dashboard controllers
	 */
	private function load_dashboards() {
		// Dashboard controllers will be autoloaded when REST API is initialized
	}
	
	/**
	 * Load helper classes
	 */
	private function load_helpers() {
		// Initialize session tracking
		if ( class_exists( 'AKF_Session_Tracker' ) ) {
			AKF_Session_Tracker::init();
		}
	}
	
	/**
	 * Load admin classes
	 */
	private function load_admin() {
		// Initialize settings page
		if ( class_exists( 'AKF_Settings_Page' ) ) {
			AKF_Settings_Page::init();
		}
	}
	
	/**
	 * Load shortcodes
	 */
	private function load_shortcodes() {
		// Initialize shortcodes
		if ( class_exists( 'AKF_Dashboard_Link' ) ) {
			AKF_Dashboard_Link::init();
		}
	}
	
	/**
	 * Initialize REST API routes
	 */
	private function init_rest_routes() {
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}
	
	/**
	 * Register all REST API routes
	 */
	public function register_rest_routes() {
		// Register SSO endpoints
		if ( class_exists( 'AKF_SSO_Endpoint' ) ) {
			AKF_SSO_Endpoint::register();
		}
		
		// Register routes for each dashboard
		// Controllers will handle their own route registration
		
		// Admin dashboard routes
		if ( class_exists( 'AKF_Admin_Controller' ) ) {
			$admin_controller = new AKF_Admin_Controller();
			$admin_controller->register_routes();
		}
		
		// Manager dashboard routes
		if ( class_exists( 'AKF_Manager_Controller' ) ) {
			$manager_controller = new AKF_Manager_Controller();
			$manager_controller->register_routes();
		}
		
		// Facilitator dashboard routes
		if ( class_exists( 'AKF_Facilitator_Controller' ) ) {
			$facilitator_controller = new AKF_Facilitator_Controller();
			$facilitator_controller->register_routes();
		}
		
		// Learner dashboard routes
		if ( class_exists( 'AKF_Learner_Controller' ) ) {
			$learner_controller = new AKF_Learner_Controller();
			$learner_controller->register_routes();
		}
	}
}

/**
 * Initialize the plugin
 */
function akf_learning_dashboard_init() {
	return AKF_Learning_Dashboard::get_instance();
}

// Start the plugin
akf_learning_dashboard_init();

