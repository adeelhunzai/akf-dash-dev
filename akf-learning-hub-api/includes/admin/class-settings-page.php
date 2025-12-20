<?php
/**
 * Admin Settings Page
 * Manages dashboard URL and CORS allowed origins
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Admin Settings Page class
 */
class AKF_Settings_Page {
	
	/**
	 * Option group name
	 */
	const OPTION_GROUP = 'akf_dashboard_settings';
	
	/**
	 * Option name for dashboard URL
	 */
	const OPTION_DASHBOARD_URL = 'akf_dashboard_url';
	
	/**
	 * Option name for allowed origins
	 */
	const OPTION_ALLOWED_ORIGINS = 'akf_allowed_origins';
	
	/**
	 * Initialize settings page
	 */
	public static function init() {
		$instance = new self();
		$instance->register_hooks();
	}
	
	/**
	 * Register WordPress hooks
	 */
	private function register_hooks() {
		add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}
	
	/**
	 * Add settings page to WordPress admin menu
	 */
	public function add_settings_page() {
		add_options_page(
			__( 'AKF Dashboard Settings', 'akf-learning-dashboard' ),
			__( 'AKF Dashboard', 'akf-learning-dashboard' ),
			'manage_options',
			'akf-dashboard-settings',
			array( $this, 'render_settings_page' )
		);
	}
	
	/**
	 * Register settings and fields
	 */
	public function register_settings() {
		// Register dashboard URL setting
		register_setting(
			self::OPTION_GROUP,
			self::OPTION_DASHBOARD_URL,
			array(
				'type' => 'string',
				'sanitize_callback' => array( $this, 'sanitize_dashboard_url' ),
				'default' => 'http://localhost:3000',
			)
		);
		
		// Register allowed origins setting
		register_setting(
			self::OPTION_GROUP,
			self::OPTION_ALLOWED_ORIGINS,
			array(
				'type' => 'string',
				'sanitize_callback' => array( $this, 'sanitize_allowed_origins' ),
				'default' => '',
			)
		);
		
		// Add settings section
		add_settings_section(
			'akf_dashboard_main_section',
			__( 'Dashboard Configuration', 'akf-learning-dashboard' ),
			array( $this, 'render_section_description' ),
			'akf-dashboard-settings'
		);
		
		// Add dashboard URL field
		add_settings_field(
			'akf_dashboard_url_field',
			__( 'Dashboard URL', 'akf-learning-dashboard' ),
			array( $this, 'render_dashboard_url_field' ),
			'akf-dashboard-settings',
			'akf_dashboard_main_section'
		);
		
		// Add allowed origins field
		add_settings_field(
			'akf_allowed_origins_field',
			__( 'Allowed Origins (CORS)', 'akf-learning-dashboard' ),
			array( $this, 'render_allowed_origins_field' ),
			'akf-dashboard-settings',
			'akf_dashboard_main_section'
		);
	}
	
	/**
	 * Sanitize dashboard URL
	 *
	 * @param string $url Dashboard URL
	 * @return string Sanitized URL
	 */
	public function sanitize_dashboard_url( $url ) {
		$url = esc_url_raw( trim( $url ) );
		
		// Remove trailing slash
		$url = rtrim( $url, '/' );
		
		// Validate URL format
		if ( ! empty( $url ) && ! filter_var( $url, FILTER_VALIDATE_URL ) ) {
			add_settings_error(
				self::OPTION_DASHBOARD_URL,
				'invalid_url',
				__( 'Invalid dashboard URL format. Please enter a valid URL.', 'akf-learning-dashboard' )
			);
			return get_option( self::OPTION_DASHBOARD_URL, 'http://localhost:3000' );
		}
		
		return $url;
	}
	
	/**
	 * Sanitize allowed origins
	 *
	 * @param string $origins Allowed origins (one per line)
	 * @return string Sanitized origins (JSON array)
	 */
	public function sanitize_allowed_origins( $origins ) {
		// If it's already JSON, decode it
		if ( is_string( $origins ) && ( substr( $origins, 0, 1 ) === '[' || substr( $origins, 0, 1 ) === '{' ) ) {
			$decoded = json_decode( $origins, true );
			if ( json_last_error() === JSON_ERROR_NONE && is_array( $decoded ) ) {
				$origins_array = $decoded;
			} else {
				// If JSON decode fails, treat as newline-separated
				$origins_array = array_filter( array_map( 'trim', explode( "\n", $origins ) ) );
			}
		} else {
			// Split by newlines
			$origins_array = array_filter( array_map( 'trim', explode( "\n", $origins ) ) );
		}
		
		// Sanitize each origin
		$sanitized = array();
		foreach ( $origins_array as $origin ) {
			$origin = trim( $origin );
			if ( empty( $origin ) ) {
				continue;
			}
			
			// Validate URL format
			if ( filter_var( $origin, FILTER_VALIDATE_URL ) ) {
				$sanitized[] = esc_url_raw( $origin );
			} else {
				// Allow protocol-relative URLs and wildcards for subdomains
				if ( preg_match( '/^https?:\/\/.+/', $origin ) || preg_match( '/^\/\/.+/', $origin ) ) {
					$sanitized[] = esc_url_raw( $origin );
				}
			}
		}
		
		// Remove duplicates
		$sanitized = array_unique( $sanitized );
		
		// Return as JSON string for storage
		return json_encode( $sanitized );
	}
	
	/**
	 * Render settings section description
	 */
	public function render_section_description() {
		echo '<p>' . esc_html__( 'Configure the dashboard URL and CORS allowed origins for the AKF Learning Dashboard API.', 'akf-learning-dashboard' ) . '</p>';
	}
	
	/**
	 * Render dashboard URL field
	 */
	public function render_dashboard_url_field() {
		$value = get_option( self::OPTION_DASHBOARD_URL, 'http://localhost:3000' );
		?>
		<input 
			type="url" 
			name="<?php echo esc_attr( self::OPTION_DASHBOARD_URL ); ?>" 
			id="akf_dashboard_url" 
			value="<?php echo esc_attr( $value ); ?>" 
			class="regular-text"
			placeholder="http://localhost:3000"
		/>
		<p class="description">
			<?php esc_html_e( 'The base URL of your Next.js dashboard. Users will be redirected to this URL with an SSO token.', 'akf-learning-dashboard' ); ?>
		</p>
		<?php
	}
	
	/**
	 * Render allowed origins field
	 */
	public function render_allowed_origins_field() {
		$origins_json = get_option( self::OPTION_ALLOWED_ORIGINS, '' );
		$origins_array = array();
		
		if ( ! empty( $origins_json ) ) {
			$decoded = json_decode( $origins_json, true );
			if ( is_array( $decoded ) ) {
				$origins_array = $decoded;
			}
		}
		
		// If empty, use default origins
		if ( empty( $origins_array ) ) {
			$origins_array = array(
				'https://akf-learning-dash-git-feat-auth-adeel-akhtars-projects.vercel.app',
				'http://localhost:3000',
				'http://localhost:3001',
			);
		}
		
		$origins_text = implode( "\n", $origins_array );
		?>
		<textarea 
			name="<?php echo esc_attr( self::OPTION_ALLOWED_ORIGINS ); ?>" 
			id="akf_allowed_origins" 
			rows="6" 
			class="large-text code"
			placeholder="https://example.com&#10;http://localhost:3000"
		><?php echo esc_textarea( $origins_text ); ?></textarea>
		<p class="description">
			<?php esc_html_e( 'Enter one origin per line. These are the allowed origins for CORS requests. Include your production, staging, and local development URLs.', 'akf-learning-dashboard' ); ?>
		</p>
		<?php
	}
	
	/**
	 * Render settings page
	 */
	public function render_settings_page() {
		// Check user capabilities
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', 'akf-learning-dashboard' ) );
		}
		
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			
			<form action="options.php" method="post">
				<?php
				settings_fields( self::OPTION_GROUP );
				do_settings_sections( 'akf-dashboard-settings' );
				submit_button( __( 'Save Settings', 'akf-learning-dashboard' ) );
				?>
			</form>
			
			<div class="akf-settings-info" style="margin-top: 30px; padding: 15px; background: #f0f0f1; border-left: 4px solid #2271b1;">
				<h2 style="margin-top: 0;"><?php esc_html_e( 'Information', 'akf-learning-dashboard' ); ?></h2>
				<p>
					<strong><?php esc_html_e( 'Dashboard URL:', 'akf-learning-dashboard' ); ?></strong><br>
					<?php esc_html_e( 'This is the base URL where your Next.js dashboard is hosted. When users click the dashboard link shortcode, they will be redirected to this URL with an SSO token appended.', 'akf-learning-dashboard' ); ?>
				</p>
				<p>
					<strong><?php esc_html_e( 'Allowed Origins:', 'akf-learning-dashboard' ); ?></strong><br>
					<?php esc_html_e( 'These URLs are allowed to make CORS requests to the WordPress REST API. Make sure to include all environments (production, staging, development) where your dashboard will be accessed from.', 'akf-learning-dashboard' ); ?>
				</p>
				<p>
					<strong><?php esc_html_e( 'Shortcode Usage:', 'akf-learning-dashboard' ); ?></strong><br>
					<code>[dashboard_link]</code> <?php esc_html_e( 'or', 'akf-learning-dashboard' ); ?> <code>[dashboard_link text="Go to Dashboard"]</code>
				</p>
			</div>
		</div>
		<?php
	}
	
	/**
	 * Enqueue admin scripts and styles
	 *
	 * @param string $hook Current admin page hook
	 */
	public function enqueue_scripts( $hook ) {
		// Only load on our settings page
		if ( 'settings_page_akf-dashboard-settings' !== $hook ) {
			return;
		}
		
		// Add any custom CSS/JS if needed in the future
	}
	
	/**
	 * Get dashboard URL from settings
	 *
	 * @return string Dashboard URL
	 */
	public static function get_dashboard_url() {
		return get_option( self::OPTION_DASHBOARD_URL, 'http://localhost:3000' );
	}
	
	/**
	 * Get allowed origins from settings
	 *
	 * @return array Allowed origins array
	 */
	public static function get_allowed_origins() {
		$origins_json = get_option( self::OPTION_ALLOWED_ORIGINS, '' );
		
		if ( empty( $origins_json ) ) {
			// Return default origins if not set
			return array(
				'https://akf-learning-dash-git-feat-auth-adeel-akhtars-projects.vercel.app',
				'http://localhost:3000',
				'http://localhost:3001',
			);
		}
		
		$decoded = json_decode( $origins_json, true );
		if ( is_array( $decoded ) && ! empty( $decoded ) ) {
			return $decoded;
		}
		
		// Fallback to defaults
		return array(
			'https://akf-learning-dash-git-feat-auth-adeel-akhtars-projects.vercel.app',
			'http://localhost:3000',
			'http://localhost:3001',
		);
	}
}

