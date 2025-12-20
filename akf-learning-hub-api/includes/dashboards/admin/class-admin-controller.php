<?php
/**
 * Admin Dashboard Controller
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Admin Dashboard REST Controller
 */
class AKF_Admin_Controller extends AKF_REST_Controller {
	
	/**
	 * Register routes
	 */
	public function register_routes() {
		// Users endpoints
		register_rest_route( $this->namespace, '/users-count', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_users_count' ),
			'permission_callback' => '__return_true',
			'args' => array(
				'period' => array(
					'required' => false,
					'default' => 'all',
					'sanitize_callback' => 'sanitize_text_field',
					'validate_callback' => function( $param ) {
						return in_array( $param, array( 'all', '1month', '3months', '6months', '1year' ) );
					},
				),
				'from' => array(
					'required' => false,
					'sanitize_callback' => 'sanitize_text_field',
					'description' => 'Start date for date range filter (ISO 8601 format)',
				),
				'to' => array(
					'required' => false,
					'sanitize_callback' => 'sanitize_text_field',
					'description' => 'End date for date range filter (ISO 8601 format)',
				),
			),
		) );
		
		register_rest_route( $this->namespace, '/users/list', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_users_list' ),
			'permission_callback' => '__return_true',
		) );
		
		register_rest_route( $this->namespace, '/users/filter-by-csv', array(
			'methods' => 'POST',
			'callback' => array( $this, 'filter_users_by_csv' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
		) );
		
		register_rest_route( $this->namespace, '/users/(?P<id>\d+)', array(
			array(
				'methods' => 'GET',
				'callback' => array( $this, 'get_user_details' ),
				'permission_callback' => '__return_true',
				'args' => array(
					'id' => array(
						'validate_callback' => function( $param ) {
							return is_numeric( $param );
						},
					),
				),
			),
			array(
				'methods' => 'PUT',
				'callback' => array( $this, 'update_user_details' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
				'args' => array(
					'id' => array(
						'validate_callback' => function( $param ) {
							return is_numeric( $param );
						},
					),
				),
			),
			array(
				'methods' => 'DELETE',
				'callback' => array( $this, 'delete_user' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
				'args' => array(
					'id' => array(
						'validate_callback' => function( $param ) {
							return is_numeric( $param );
						},
					),
				),
			),
		) );
		
		// Teams endpoints
		register_rest_route( $this->namespace, '/teams', array(
			array(
				'methods' => 'GET',
				'callback' => array( $this, 'get_teams_list' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
				'args' => array(
					'page' => array(
						'default' => 1,
						'validate_callback' => function( $param ) {
							return is_numeric( $param );
						},
					),
					'per_page' => array(
						'default' => 10,
						'validate_callback' => function( $param ) {
							return is_numeric( $param );
						},
					),
					'search' => array(
						'default' => '',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'status' => array(
						'default' => 'all',
						'sanitize_callback' => 'sanitize_text_field',
					),
				),
			),
			array(
				'methods' => 'POST',
				'callback' => array( $this, 'create_team' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			),
		) );
		
		register_rest_route( $this->namespace, '/teams/(?P<id>\d+)', array(
			array(
				'methods' => 'GET',
				'callback' => array( $this, 'get_team_details' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
				'args' => array(
					'id' => array(
						'validate_callback' => function( $param ) {
							return is_numeric( $param );
						},
					),
				),
			),
			array(
				'methods' => 'PUT',
				'callback' => array( $this, 'update_team' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
				'args' => array(
					'id' => array(
						'validate_callback' => function( $param ) {
							return is_numeric( $param );
						},
					),
				),
			),
			array(
				'methods' => 'DELETE',
				'callback' => array( $this, 'delete_team' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
				'args' => array(
					'id' => array(
						'validate_callback' => function( $param ) {
							return is_numeric( $param );
						},
					),
				),
			),
		) );
		
		register_rest_route( $this->namespace, '/teams/(?P<id>\d+)/members', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_team_members' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
			'args' => array(
				'id' => array(
					'validate_callback' => function( $param ) {
						return is_numeric( $param );
					},
				),
			),
		) );
		
		register_rest_route( $this->namespace, '/teams/(?P<team_id>\d+)/members/(?P<user_id>\d+)', array(
			'methods' => 'DELETE',
			'callback' => array( $this, 'remove_team_member' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
			'args' => array(
				'team_id' => array(
					'validate_callback' => function( $param ) {
						return is_numeric( $param );
					},
				),
				'user_id' => array(
					'validate_callback' => function( $param ) {
						return is_numeric( $param );
					},
				),
			),
		) );
		
		// Courses endpoints
		register_rest_route( $this->namespace, '/courses', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_courses_list' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
		) );
		
		register_rest_route( $this->namespace, '/course-completion-rate', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_course_completion_rate' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
			'args' => array(
				'period' => array(
					'required' => false,
					'default' => 'all',
					'sanitize_callback' => 'sanitize_text_field',
					'validate_callback' => function( $param ) {
						return in_array( $param, array( 'all', '1month', '3months', '6months', '1year' ) );
					},
				),
				'from' => array(
					'required' => false,
					'sanitize_callback' => 'sanitize_text_field',
					'description' => 'Start date for date range filter (ISO 8601 format)',
				),
				'to' => array(
					'required' => false,
					'sanitize_callback' => 'sanitize_text_field',
					'description' => 'End date for date range filter (ISO 8601 format)',
				),
			),
		) );
		
		register_rest_route( $this->namespace, '/top-courses', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_top_courses' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
			'args' => array(
				'period' => array(
					'required' => false,
					'default' => 'all',
					'sanitize_callback' => 'sanitize_text_field',
					'validate_callback' => function( $param ) {
						return in_array( $param, array( 'all', '1month', '3months', '6months', '1year' ) );
					},
				),
				'from' => array(
					'required' => false,
					'sanitize_callback' => 'sanitize_text_field',
					'description' => 'Start date for date range filter (ISO 8601 format)',
				),
				'to' => array(
					'required' => false,
					'sanitize_callback' => 'sanitize_text_field',
					'description' => 'End date for date range filter (ISO 8601 format)',
				),
			),
		) );
		
		// Reports endpoints
		register_rest_route( $this->namespace, '/course-report', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_course_report' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
		) );
		
		register_rest_route( $this->namespace, '/learner-report', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_learner_report' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
		) );
		
		register_rest_route( $this->namespace, '/team-report', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_team_report' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
		) );
		
		register_rest_route( $this->namespace, '/course-popularity', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_course_popularity' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
		) );
		
		register_rest_route( $this->namespace, '/certificate-sales', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_certificate_sales_report' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
		) );
		
		// Settings endpoints
		register_rest_route( $this->namespace, '/settings/general', array(
			array(
				'methods' => 'GET',
				'callback' => array( $this, 'get_general_settings' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			),
			array(
				'methods' => 'PUT',
				'callback' => array( $this, 'update_general_settings' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			),
		) );
		
		register_rest_route( $this->namespace, '/settings/course', array(
			array(
				'methods' => 'GET',
				'callback' => array( $this, 'get_course_settings' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			),
			array(
				'methods' => 'PUT',
				'callback' => array( $this, 'update_course_settings' ),
				'permission_callback' => array( $this, 'check_admin_permission' ),
			),
		) );
		
		// Sessions endpoints
		register_rest_route( $this->namespace, '/sessions', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_login_sessions' ),
			'permission_callback' => array( $this, 'check_authenticated_permission' ),
		) );
		
		register_rest_route( $this->namespace, '/sessions/(?P<id>[a-zA-Z0-9_-]+)', array(
			'methods' => 'DELETE',
			'callback' => array( $this, 'delete_login_session' ),
			'permission_callback' => array( $this, 'check_authenticated_permission' ),
		) );
		
		register_rest_route( $this->namespace, '/sessions/logout-all', array(
			'methods' => 'POST',
			'callback' => array( $this, 'logout_all_sessions' ),
			'permission_callback' => array( $this, 'check_authenticated_permission' ),
		) );
		
		// WordPress core endpoint extension
		register_rest_route( 'wp/v2', '/users/by-roles', array(
			'methods' => 'GET',
			'callback' => array( $this, 'get_users_by_roles' ),
			'permission_callback' => array( $this, 'check_admin_permission' ),
		) );
	}
	
	/**
	 * Check admin permission
	 *
	 * @param WP_REST_Request $request Request object
	 * @return bool|WP_Error
	 */
	public function check_admin_permission( $request ) {
		return is_admin_user();
	}
	
	/**
	 * Check authenticated permission
	 *
	 * @param WP_REST_Request $request Request object
	 * @return bool|WP_Error
	 */
	public function check_authenticated_permission( $request ) {
		return is_authenticated_user();
	}
	
	// ============================================
	// USER ENDPOINTS
	// ============================================
	
	/**
	 * Get users count with roles and stats
	 */
/**
 * Get users count with roles and stats
 */
public function get_users_count( $request ) {
	global $wpdb;
	
	$period = $request->get_param( 'period' ) ?: 'all';
	$from_date = $request->get_param( 'from' );
	$to_date = $request->get_param( 'to' );
	$date_from = null;
	$date_to = null;
	$use_date_range = false;
	
	// Check if custom date range is provided (takes precedence over period)
	if ( ! empty( $from_date ) && ! empty( $to_date ) ) {
		$use_date_range = true;
		// Parse ISO 8601 dates
		$date_from = date( 'Y-m-d H:i:s', strtotime( $from_date ) );
		$date_to = date( 'Y-m-d H:i:s', strtotime( $to_date ) );
	} elseif ( $period !== 'all' ) {
		// Handle date filtering based on period
		$current_date = current_time( 'Y-m-d H:i:s' );
		switch ( $period ) {
			case '1month':
				$date_from = date( 'Y-m-d H:i:s', strtotime( '-1 month', strtotime( $current_date ) ) );
				break;
			case '3months':
				$date_from = date( 'Y-m-d H:i:s', strtotime( '-3 months', strtotime( $current_date ) ) );
				break;
			case '6months':
				$date_from = date( 'Y-m-d H:i:s', strtotime( '-6 months', strtotime( $current_date ) ) );
				break;
			case '1year':
				$date_from = date( 'Y-m-d H:i:s', strtotime( '-1 year', strtotime( $current_date ) ) );
				break;
			default:
				// Invalid period, default to 'all'
				$period = 'all';
				break;
		}
	}
	
	$roles_to_count = array( 'group_leader', 'group_leader_clone', 'subscriber' );
	$response = array(
		'period' => $use_date_range ? 'custom' : $period,
	);
	
	// Add date range info to response if using custom range
	if ( $use_date_range ) {
		$response['date_range'] = array(
			'from' => $date_from,
			'to' => $date_to,
		);
	}
	
	// Total user count
	if ( ! $date_from && ! $use_date_range ) {
		// All time - use count_users() for efficiency
		$total_users = count_users();
		$response['total_users'] = $total_users['total_users'];
	} else {
		// Specific period or date range - count users registered during period
		if ( $use_date_range ) {
			$query = $wpdb->prepare( 
				"SELECT COUNT(ID) FROM $wpdb->users WHERE user_registered >= %s AND user_registered <= %s", 
				$date_from,
				$date_to
			);
		} else {
			$query = $wpdb->prepare( 
				"SELECT COUNT(ID) FROM $wpdb->users WHERE user_registered >= %s", 
				$date_from 
			);
		}
		$response['total_users'] = (int) $wpdb->get_var( $query );
	}
	
	// Count users by specific roles
	foreach ( $roles_to_count as $role ) {
		$args = array(
			'role'   => $role,
			'fields' => 'ID',
		);
		
		// Add date filter for specific period or date range
		if ( $date_from ) {
			if ( $use_date_range ) {
				$args['date_query'] = array(
					'relation' => 'AND',
					array(
						'after'     => $date_from,
						'inclusive' => true,
						'column'    => 'user_registered',
					),
					array(
						'before'    => $date_to,
						'inclusive' => true,
						'column'    => 'user_registered',
					),
				);
			} else {
				$args['date_query'] = array(
					array(
						'after'  => $date_from,
						'column' => 'user_registered',
					),
				);
			}
		}
		
		$user_query = new WP_User_Query( $args );
		$response[ $role ] = $user_query->get_total();
	}
	
	// New Registrations (last 7 days) - always calculated the same way
	$current_date = current_time( 'Y-m-d H:i:s' );
	$new_registrations_query = $wpdb->prepare( 
		"SELECT COUNT(ID) FROM $wpdb->users WHERE user_registered >= DATE_SUB(%s, INTERVAL 7 DAY)", 
		$current_date 
	);
	$response['new_registrations'] = (int) $wpdb->get_var( $new_registrations_query );
	
	// Active courses and teams
	if ( ! $date_from && ! $use_date_range ) {
		// All time - no date filter
		$response['active_courses'] = $this->get_active_courses_count();
		$response['active_teams'] = $this->get_active_teams_count();
	} else {
		// Specific period or date range - filter by date
		$response['active_courses'] = $this->get_active_courses_count( $date_from, $use_date_range ? $date_to : null );
		$response['active_teams'] = $this->get_active_teams_count( $date_from, $use_date_range ? $date_to : null );
	}
	
	return new WP_REST_Response( $response, 200 );
}

/**
 * Get active course count
 * 
 * @param string|null $date_from Optional date to filter courses created/modified after this date
 * @param string|null $date_to Optional end date for date range filter
 * @return int Number of active courses
 */
private function get_active_courses_count( $date_from = null, $date_to = null ) {
	$args = array(
		'post_type'      => 'sfwd-courses',
		'post_status'    => 'publish',
		'fields'         => 'ids',
		'posts_per_page' => -1,
	);
	
	// Add date filter if provided
	if ( $date_from ) {
		if ( $date_to ) {
			// Date range filter
			$args['date_query'] = array(
				'relation' => 'OR',
				array(
					'relation' => 'AND',
					array(
						'column'    => 'post_date',
						'after'     => $date_from,
						'inclusive' => true,
					),
					array(
						'column'    => 'post_date',
						'before'    => $date_to,
						'inclusive' => true,
					),
				),
				array(
					'relation' => 'AND',
					array(
						'column'    => 'post_modified',
						'after'     => $date_from,
						'inclusive' => true,
					),
					array(
						'column'    => 'post_modified',
						'before'    => $date_to,
						'inclusive' => true,
					),
				),
			);
		} else {
			// Period filter (only from date)
			$args['date_query'] = array(
				'relation' => 'OR',
				array(
					'column' => 'post_date',
					'after'  => $date_from,
				),
				array(
					'column' => 'post_modified',
					'after'  => $date_from,
				),
			);
		}
	}
	
	return count( get_posts( $args ) );
}

/**
 * Get active team (group) count
 * 
 * @param string|null $date_from Optional date to filter teams created/modified after this date
 * @param string|null $date_to Optional end date for date range filter
 * @return int Number of active teams
 */
private function get_active_teams_count( $date_from = null, $date_to = null ) {
	$args = array(
		'post_type'      => 'groups',
		'post_status'    => 'publish',
		'fields'         => 'ids',
		'posts_per_page' => -1,
	);
	
	// Add date filter if provided
	if ( $date_from ) {
		if ( $date_to ) {
			// Date range filter
			$args['date_query'] = array(
				'relation' => 'OR',
				array(
					'relation' => 'AND',
					array(
						'column'    => 'post_date',
						'after'     => $date_from,
						'inclusive' => true,
					),
					array(
						'column'    => 'post_date',
						'before'    => $date_to,
						'inclusive' => true,
					),
				),
				array(
					'relation' => 'AND',
					array(
						'column'    => 'post_modified',
						'after'     => $date_from,
						'inclusive' => true,
					),
					array(
						'column'    => 'post_modified',
						'before'    => $date_to,
						'inclusive' => true,
					),
				),
			);
		} else {
			// Period filter (only from date)
			$args['date_query'] = array(
				'relation' => 'OR',
				array(
					'column' => 'post_date',
					'after'  => $date_from,
				),
				array(
					'column' => 'post_modified',
					'after'  => $date_from,
				),
			);
		}
	}
	
	return count( get_posts( $args ) );
}
	
	/**
	 * Get users list with details
	 */
	public function get_users_list( $request ) {
		// Pagination setup
		$page = max( 1, intval( $request->get_param( 'page' ) ?: 1 ) );
		$per_page = max( 1, min( 100, intval( $request->get_param( 'per_page' ) ?: 5 ) ) );
		
		// Get search and role filter parameters
		$search = sanitize_text_field( $request->get_param( 'search' ) ?: '' );
		$role_filter = sanitize_text_field( $request->get_param( 'role' ) ?: '' );
		
		// Build user query arguments
		$args = array(
			'number'  => $per_page,
			'paged'   => $page,
			'fields'  => 'all',
			'orderby' => 'user_registered',
			'order'   => 'DESC',
		);
		
		// Add search parameter if provided
		if ( ! empty( $search ) ) {
			$args['search'] = '*' . $search . '*';
			$args['search_columns'] = array( 'user_login', 'user_email', 'display_name' );
		}
		
		// Add role filter if provided
		// Correct mappings: facilitator = group_leader, manager = group_leader_clone
		$role_map = array(
			'learner' => 'subscriber',
			'facilitator' => 'group_leader',
			'manager' => 'group_leader_clone',
			'akdn' => 'akdn',
		);
		
		if ( ! empty( $role_filter ) && $role_filter !== 'all' && isset( $role_map[ $role_filter ] ) ) {
			$args['role'] = $role_map[ $role_filter ];
		}
		
		// Fetch users
		$users = get_users( $args );
		
		// Get total users count with same filters for pagination
		$count_args = array(
			'fields' => 'ID',
		);
		
		if ( ! empty( $search ) ) {
			$count_args['search'] = '*' . $search . '*';
			$count_args['search_columns'] = array( 'user_login', 'user_email', 'display_name' );
		}
		
		if ( ! empty( $role_filter ) && $role_filter !== 'all' && isset( $role_map[ $role_filter ] ) ) {
			$count_args['role'] = $role_map[ $role_filter ];
		}
		
		$total_users_count = count( get_users( $count_args ) );
		$total_pages = ceil( $total_users_count / $per_page );
		
		$user_data = array();
		
		foreach ( $users as $user ) {
			// Get LearnDash teams (groups)
			$teams = function_exists( 'learndash_get_users_group_ids' ) ? learndash_get_users_group_ids( $user->ID ) : array();
			$team_names = array();
			if ( ! empty( $teams ) ) {
				foreach ( $teams as $team_id ) {
					$team_names[] = get_the_title( $team_id );
				}
			}
			
			// Get number of enrolled courses
			$courses = function_exists( 'learndash_user_get_enrolled_courses' ) ? learndash_user_get_enrolled_courses( $user->ID, array(), true ) : array();
			$course_count = is_array( $courses ) ? count( $courses ) : 0;
			
			// Get avatar URL
			$avatar_url = get_avatar_url( $user->ID, array( 'size' => 96 ) );
			
			// Build user data object
			$user_data[] = array(
				'ID'                => $user->ID,
				'user_login'        => $user->user_login,
				'user_email'        => $user->user_email,
				'display_name'      => $user->display_name,
				'roles'             => $user->roles,
				'avatar_url'        => $avatar_url,
				'teams'             => $team_names,
				'team_count'        => count( $team_names ),
				'courses_enrolled'  => $course_count,
			);
		}
		
		// Final structured response
		$response = array(
			'current_page' => $page,
			'per_page'     => $per_page,
			'total_pages'  => $total_pages,
			'total_users'  => $total_users_count,
			'users'        => $user_data,
		);
		
		return new WP_REST_Response( $response, 200 );
	}
	
	/**
	 * Filter users by CSV file
	 * Accepts a CSV with name and email columns, returns matching learners
	 */
	public function filter_users_by_csv( $request ) {
		try {
			// Check if file was uploaded
			$files = $request->get_file_params();
			
			if ( empty( $files['csv_file'] ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No CSV file uploaded. Please upload a file with key "csv_file".',
				), 400 );
			}
			
			$file = $files['csv_file'];
			
			// Validate file type
			$allowed_types = array( 'text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel' );
			$file_type = $file['type'];
			$file_ext = strtolower( pathinfo( $file['name'], PATHINFO_EXTENSION ) );
			
			if ( ! in_array( $file_type, $allowed_types ) && $file_ext !== 'csv' ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Invalid file type. Please upload a CSV file.',
				), 400 );
			}
			
			// Check for upload errors
			if ( $file['error'] !== UPLOAD_ERR_OK ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'File upload error. Error code: ' . $file['error'],
				), 400 );
			}
			
			// Read and parse CSV
			$csv_data = array();
			$emails_from_csv = array();
			
			// Read file contents and remove BOM if present
			$file_contents = file_get_contents( $file['tmp_name'] );
			
			// Remove UTF-8 BOM if present
			$bom = pack( 'H*', 'EFBBBF' );
			$file_contents = preg_replace( "/^$bom/", '', $file_contents );
			
			// Normalize line endings
			$file_contents = str_replace( array( "\r\n", "\r" ), "\n", $file_contents );
			
			// Split into lines
			$lines = explode( "\n", $file_contents );
			$lines = array_filter( $lines, function( $line ) {
				return trim( $line ) !== '';
			});
			$lines = array_values( $lines ); // Re-index array
			
			if ( empty( $lines ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'CSV file is empty.',
				), 400 );
			}
			
			// Parse header (first line)
			$header_line = array_shift( $lines );
			
			// Auto-detect delimiter by counting occurrences in header
			$tab_count = substr_count( $header_line, "\t" );
			$comma_count = substr_count( $header_line, "," );
			$semicolon_count = substr_count( $header_line, ";" );
			
			// Choose delimiter with most occurrences
			$delimiter = ',';
			$max_count = $comma_count;
			
			if ( $tab_count > $max_count ) {
				$delimiter = "\t";
				$max_count = $tab_count;
			}
			if ( $semicolon_count > $max_count ) {
				$delimiter = ";";
			}
			
			$header = str_getcsv( $header_line, $delimiter );
			
			// Normalize header names (lowercase, trim, remove quotes)
			$header = array_map( function( $col ) {
				$col = trim( $col );
				$col = trim( $col, '"\'');
				return strtolower( $col );
			}, $header );
			
			// Parse data rows
			$row_number = 1;
			foreach ( $lines as $line ) {
				$row_number++;
				$row = str_getcsv( $line, $delimiter );
				
				if ( empty( $row ) || ( count( $row ) === 1 && empty( trim( $row[0] ) ) ) ) {
					continue;
				}
				
				// Map row to associative array
				$row_data = array();
				foreach ( $header as $index => $col_name ) {
					$value = isset( $row[ $index ] ) ? trim( $row[ $index ] ) : '';
					$value = trim( $value, '"\''); // Remove quotes
					$row_data[ $col_name ] = $value;
				}
				
				// Extract email (check common column names)
				$email = '';
				$email_columns = array( 'email', 'user_email', 'email_address', 'e-mail', 'mail' );
				foreach ( $email_columns as $col ) {
					if ( isset( $row_data[ $col ] ) && ! empty( $row_data[ $col ] ) ) {
						$email = sanitize_email( $row_data[ $col ] );
						break;
					}
				}
				
				// Extract name (check common column names)
				$name = '';
				$name_columns = array( 'name', 'display_name', 'full_name', 'fullname', 'user_name', 'username' );
				foreach ( $name_columns as $col ) {
					if ( isset( $row_data[ $col ] ) && ! empty( $row_data[ $col ] ) ) {
						$name = sanitize_text_field( $row_data[ $col ] );
						break;
					}
				}
				
				// If no single name field, try first_name + last_name
				if ( empty( $name ) ) {
					$first_name = '';
					$last_name = '';
					$first_name_cols = array( 'first_name', 'firstname', 'first' );
					$last_name_cols = array( 'last_name', 'lastname', 'last', 'surname' );
					
					foreach ( $first_name_cols as $col ) {
						if ( isset( $row_data[ $col ] ) && ! empty( $row_data[ $col ] ) ) {
							$first_name = sanitize_text_field( $row_data[ $col ] );
							break;
						}
					}
					foreach ( $last_name_cols as $col ) {
						if ( isset( $row_data[ $col ] ) && ! empty( $row_data[ $col ] ) ) {
							$last_name = sanitize_text_field( $row_data[ $col ] );
							break;
						}
					}
					
					$name = trim( $first_name . ' ' . $last_name );
				}
				
				if ( ! empty( $email ) ) {
					$emails_from_csv[] = $email;
					$csv_data[] = array(
						'email' => $email,
						'name' => $name,
						'row' => $row_number,
					);
				}
			}
			
			if ( empty( $emails_from_csv ) ) {
				// Get first data line for debugging
				$first_data_line = isset( $lines[0] ) ? $lines[0] : 'no data lines';
				$first_row_parsed = isset( $lines[0] ) ? str_getcsv( $lines[0], $delimiter ) : array();
				
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No valid email addresses found in CSV. Please ensure your CSV has an "email" column.',
					'csv_rows_processed' => count( $csv_data ),
					'headers_found' => $header,
					'delimiter_detected' => $delimiter === "\t" ? 'tab' : $delimiter,
					'total_lines' => count( $lines ) + 1,
					'first_data_row_parsed' => $first_row_parsed,
					'raw_header_line' => $header_line,
				), 400 );
			}
			
			// Find matching users (learners/subscribers)
			global $wpdb;
			
			$email_placeholders = implode( ',', array_fill( 0, count( $emails_from_csv ), '%s' ) );
			$query = $wpdb->prepare(
				"SELECT ID, user_login, user_email, display_name 
				FROM {$wpdb->users} 
				WHERE user_email IN ($email_placeholders)",
				$emails_from_csv
			);
			
			$matching_users = $wpdb->get_results( $query );
			
			// Build response with user details
			$found_users = array();
			$not_found_emails = array();
			$found_emails = array();
			
			foreach ( $matching_users as $user ) {
				$user_obj = get_userdata( $user->ID );
				
				// Only include learners (subscribers)
				if ( ! in_array( 'subscriber', $user_obj->roles ) ) {
					continue;
				}
				
				$found_emails[] = strtolower( $user->user_email );
				
				// Get teams
				$teams = function_exists( 'learndash_get_users_group_ids' ) ? learndash_get_users_group_ids( $user->ID ) : array();
				$team_names = array();
				if ( ! empty( $teams ) ) {
					foreach ( $teams as $team_id ) {
						$team_names[] = get_the_title( $team_id );
					}
				}
				
				// Get courses count
				$courses = function_exists( 'learndash_user_get_enrolled_courses' ) ? learndash_user_get_enrolled_courses( $user->ID, array(), true ) : array();
				$course_count = is_array( $courses ) ? count( $courses ) : 0;
				
				// Get avatar
				$avatar_url = get_avatar_url( $user->ID, array( 'size' => 96 ) );
				
				$found_users[] = array(
					'ID' => $user->ID,
					'user_login' => $user->user_login,
					'user_email' => $user->user_email,
					'display_name' => $user->display_name,
					'roles' => $user_obj->roles,
					'avatar_url' => $avatar_url,
					'teams' => $team_names,
					'team_count' => count( $team_names ),
					'courses_enrolled' => $course_count,
				);
			}
			
			// Find emails that weren't matched
			foreach ( $emails_from_csv as $email ) {
				if ( ! in_array( strtolower( $email ), $found_emails ) ) {
					// Find the name from csv_data
					$csv_name = '';
					foreach ( $csv_data as $csv_row ) {
						if ( strtolower( $csv_row['email'] ) === strtolower( $email ) ) {
							$csv_name = $csv_row['name'];
							break;
						}
					}
					$not_found_emails[] = array(
						'email' => $email,
						'name' => $csv_name,
					);
				}
			}
			
			return new WP_REST_Response( array(
				'success' => true,
				'message' => 'CSV processed successfully.',
				'total_csv_rows' => count( $csv_data ),
				'total_found' => count( $found_users ),
				'total_not_found' => count( $not_found_emails ),
				'users' => $found_users,
				'not_found' => $not_found_emails,
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while processing the CSV.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Get user details
	 */
	public function get_user_details( $request ) {
		$user_id = $request->get_param( 'id' );
		
		// Get user data
		$user = get_userdata( $user_id );
		
		if ( ! $user ) {
			return new WP_Error( 'user_not_found', 'User not found', array( 'status' => 404 ) );
		}
		
		// Get LearnDash teams (groups)
		$teams = function_exists( 'learndash_get_users_group_ids' ) ? learndash_get_users_group_ids( $user_id ) : array();
		$team_names = array();
		if ( ! empty( $teams ) ) {
			foreach ( $teams as $team_id ) {
				$team_names[] = get_the_title( $team_id );
			}
		}
		
		// Get enrolled courses
		$enrolled_courses = function_exists( 'learndash_user_get_enrolled_courses' ) ? learndash_user_get_enrolled_courses( $user_id, array(), true ) : array();
		$total_courses = is_array( $enrolled_courses ) ? count( $enrolled_courses ) : 0;
		
		// Get completed courses
		$completed_courses = array();
		if ( ! empty( $enrolled_courses ) ) {
			foreach ( $enrolled_courses as $course_id ) {
				if ( function_exists( 'learndash_course_completed' ) && learndash_course_completed( $user_id, $course_id ) ) {
					$completed_courses[] = $course_id;
				}
			}
		}
		$completed_count = count( $completed_courses );
		
		// Calculate completion rate
		$completion_rate = $total_courses > 0 ? round( ( $completed_count / $total_courses ) * 100 ) : 0;
		
		// Get last login from sessions data
		$last_login = null;
		$sessions = get_user_meta( $user_id, 'akf_login_sessions', true );
		
		if ( is_array( $sessions ) && ! empty( $sessions ) ) {
			// Find the most recent session by lastActive timestamp
			$latest_timestamp = 0;
			foreach ( $sessions as $session ) {
				if ( isset( $session['lastActive'] ) ) {
					$session_timestamp = is_numeric( $session['lastActive'] ) 
						? intval( $session['lastActive'] ) 
						: strtotime( $session['lastActive'] );
					if ( $session_timestamp > $latest_timestamp ) {
						$latest_timestamp = $session_timestamp;
					}
				}
			}
			if ( $latest_timestamp > 0 ) {
				$last_login = $latest_timestamp;
			}
		}
		
		// Fallback to last_login meta if no sessions found
		if ( ! $last_login ) {
			$last_login = get_user_meta( $user_id, 'last_login', true );
			$last_login = $last_login ? intval( $last_login ) : null;
		}
		
		$last_login_date = $last_login ? date( 'Y-m-d H:i:s', $last_login ) : null;
		
		// Calculate days since last login
		$days_since_login = null;
		if ( $last_login ) {
			$days_since_login = floor( ( time() - $last_login ) / ( 60 * 60 * 24 ) );
		}
		
		// Get user registration date
		$registration_date = $user->user_registered;
		$days_since_registration = floor( ( time() - strtotime( $registration_date ) ) / ( 60 * 60 * 24 ) );
		
		// Get organization/department (custom meta field)
		$organization = get_user_meta( $user_id, 'organization', true ) ?: 'Not specified';
		
		// Get avatar URL
		$avatar_url = get_avatar_url( $user_id, array( 'size' => 96 ) );
		
		// Build response
		$response = array(
			'ID' => $user->ID,
			'user_login' => $user->user_login,
			'user_email' => $user->user_email,
			'display_name' => $user->display_name,
			'roles' => $user->roles,
			'avatar_url' => $avatar_url,
			'organization' => $organization,
			'last_login' => $last_login_date,
			'days_since_login' => $days_since_login,
			'days_since_registration' => $days_since_registration,
			'teams' => $team_names,
			'team_count' => count( $team_names ),
			'total_courses' => $total_courses,
			'completed_courses' => $completed_count,
			'completion_rate' => $completion_rate,
		);
		
		return new WP_REST_Response( $response, 200 );
	}
	
	/**
	 * Update user details
	 */
	public function update_user_details( $request ) {
		$user_id = $request->get_param( 'id' );
		
		// Get user data
		$user = get_userdata( $user_id );
		
		if ( ! $user ) {
			return new WP_Error( 'user_not_found', 'User not found', array( 'status' => 404 ) );
		}
		
		// Get parameters from request body
		$params = $request->get_json_params();
		
		$display_name = isset( $params['display_name'] ) ? sanitize_text_field( $params['display_name'] ) : null;
		$email = isset( $params['email'] ) ? sanitize_email( $params['email'] ) : null;
		$role = isset( $params['role'] ) ? sanitize_text_field( $params['role'] ) : null;
		$organization = isset( $params['organization'] ) ? sanitize_text_field( $params['organization'] ) : null;
		
		// Prepare user data for update
		$user_data = array( 'ID' => $user_id );
		$updated_fields = array();
		
		// Update display name if provided
		if ( $display_name !== null && $display_name !== '' ) {
			$user_data['display_name'] = $display_name;
			$updated_fields[] = 'display_name';
		}
		
		// Update email if provided and valid
		if ( $email !== null && $email !== '' ) {
			// Check if email is already in use by another user
			$email_exists = email_exists( $email );
			if ( $email_exists && $email_exists != $user_id ) {
				return new WP_Error(
					'email_exists',
					'This email is already registered to another user',
					array( 'status' => 400 )
				);
			}
			
			if ( ! is_email( $email ) ) {
				return new WP_Error(
					'invalid_email',
					'Invalid email address',
					array( 'status' => 400 )
				);
			}
			
			$user_data['user_email'] = $email;
			$updated_fields[] = 'email';
		}
		
		// Update user data
		$result = wp_update_user( $user_data );
		
		if ( is_wp_error( $result ) ) {
			return new WP_Error(
				'update_failed',
				'Failed to update user: ' . $result->get_error_message(),
				array( 'status' => 500 )
			);
		}
		
		// Update role if provided
		if ( $role !== null && $role !== '' ) {
			$valid_roles = array( 'subscriber', 'group_leader', 'group_leader_clone' );
			
			if ( ! in_array( $role, $valid_roles ) ) {
				return new WP_Error(
					'invalid_role',
					'Invalid role specified',
					array( 'status' => 400 )
				);
			}
			
			// Remove all existing roles and set the new one
			$user_obj = new WP_User( $user_id );
			$user_obj->set_role( $role );
			$updated_fields[] = 'role';
		}
		
		// Update organization (custom meta field) if provided
		if ( $organization !== null ) {
			update_user_meta( $user_id, 'organization', $organization );
			$updated_fields[] = 'organization';
		}
		
		// Get updated user data
		$updated_user = get_userdata( $user_id );
		$updated_organization = get_user_meta( $user_id, 'organization', true );
		
		// Build response
		$response = array(
			'success' => true,
			'message' => 'User updated successfully',
			'updated_fields' => $updated_fields,
			'user' => array(
				'ID' => $updated_user->ID,
				'display_name' => $updated_user->display_name,
				'user_email' => $updated_user->user_email,
				'roles' => $updated_user->roles,
				'organization' => $updated_organization ?: 'Not specified',
			),
		);
		
		return new WP_REST_Response( $response, 200 );
	}
	
	/**
	 * Delete user
	 */
	public function delete_user( $request ) {
		$user_id = $request->get_param( 'id' );
		
		// Get user data before deletion
		$user = get_userdata( $user_id );
		
		if ( ! $user ) {
			return new WP_Error( 'user_not_found', 'User not found', array( 'status' => 404 ) );
		}
		
		// Prevent deletion of current user
		$current_user_id = get_current_user_id();
		if ( $user_id == $current_user_id ) {
			return new WP_Error(
				'cannot_delete_self',
				'You cannot delete your own account',
				array( 'status' => 403 )
			);
		}
		
		// Prevent deletion of super admin
		if ( is_super_admin( $user_id ) ) {
			return new WP_Error(
				'cannot_delete_admin',
				'Super administrators cannot be deleted',
				array( 'status' => 403 )
			);
		}
		
		// Store user info for response
		$deleted_user_name = $user->display_name;
		$deleted_user_email = $user->user_email;
		
		// Include WordPress user functions
		require_once( ABSPATH . 'wp-admin/includes/user.php' );
		
		// Delete the user
		$result = wp_delete_user( $user_id );
		
		if ( ! $result ) {
			return new WP_Error(
				'delete_failed',
				'Failed to delete user. Please try again.',
				array( 'status' => 500 )
			);
		}
		
		// Build response
		$response = array(
			'success' => true,
			'message' => 'User deleted successfully',
			'deleted_user_id' => $user_id,
			'deleted_user_name' => $deleted_user_name,
			'deleted_user_email' => $deleted_user_email,
		);
		
		return new WP_REST_Response( $response, 200 );
	}
	
	/**
	 * Get users by roles (WordPress core endpoint extension)
	 */
	public function get_users_by_roles( $request ) {
		// Get the role parameter from the URL query string
		$role_to_fetch = $request->get_param( 'role' );
		
		// If no role is provided, include the Subscriber role in the default set of roles
		if ( ! $role_to_fetch ) {
			$roles_to_fetch = array( 'administrator', 'akdn', 'manager', 'facilitator', 'subscriber' );
		} elseif ( $role_to_fetch === 'all' ) {
			// If the role is 'all', fetch all users regardless of role
			$roles_to_fetch = array();
		} else {
			// If a specific role is passed, query users with that role
			$roles_to_fetch = array( $role_to_fetch );
		}
		
		// Log role to fetch for debugging purposes
		error_log( 'Roles to fetch: ' . implode( ', ', $roles_to_fetch ) );
		
		// Query users with the specified roles
		$args = array(
			'role__in' => $roles_to_fetch,
			'orderby' => 'ID',
			'order' => 'ASC',
			'fields' => array( 'ID', 'user_login', 'user_email', 'roles' ),
		);
		
		// Fetch users
		$user_query = new WP_User_Query( $args );
		
		// Check if users are found
		if ( empty( $user_query->get_results() ) ) {
			return new WP_REST_Response( 'No users found with the specified role(s).', 404 );
		}
		
		// Return users in the API response
		$users = array();
		foreach ( $user_query->get_results() as $user ) {
			$user_data = get_userdata( $user->ID );
			$users[] = array(
				'id' => $user->ID,
				'username' => $user->user_login,
				'email' => $user->user_email,
				'roles' => $user_data->roles,
			);
		}
		
		return new WP_REST_Response( $users, 200 );
	}
	
	// ============================================
	// TEAM ENDPOINTS
	// ============================================
	
	/**
	 * Get teams list
	 */
	public function get_teams_list( $request ) {
		$page = $request->get_param( 'page' );
		$per_page = $request->get_param( 'per_page' );
		$search = $request->get_param( 'search' );
		$status_filter = $request->get_param( 'status' );
		
		// Get all LearnDash groups
		$args = array(
			'post_type' => 'groups',
			'posts_per_page' => $per_page,
			'paged' => $page,
			'post_status' => 'publish',
			'orderby' => 'date',
			'order' => 'DESC',
		);
		
		// Add search if provided
		if ( ! empty( $search ) ) {
			$args['s'] = $search;
		}
		
		$query = new WP_Query( $args );
		$teams = array();
		
		foreach ( $query->posts as $group ) {
			$group_id = $group->ID;
			
			// Get group users
			$group_users = learndash_get_groups_user_ids( $group_id );
			$total_members = count( $group_users );
			
			// Get group leaders (facilitators)
			$group_leaders = learndash_get_groups_administrator_ids( $group_id );
			$facilitators_count = count( $group_leaders );
			
			// Calculate progress based on team's associated course(s) completion
			$progress = 0;
			
			if ( $total_members > 0 ) {
				// Get courses associated with this team (group) - try ALL possible methods
				$group_courses = array();
				
				// Method 1: Use LearnDash function (most common)
				if ( function_exists( 'learndash_get_group_courses' ) ) {
					$group_courses = learndash_get_group_courses( $group_id );
					// Ensure it's an array
					if ( ! is_array( $group_courses ) ) {
						$group_courses = array();
					}
				}
				
				// Method 2: Try alternative LearnDash function
				if ( empty( $group_courses ) && function_exists( 'learndash_group_enrolled_courses' ) ) {
					$group_courses = learndash_group_enrolled_courses( $group_id );
					if ( ! is_array( $group_courses ) ) {
						$group_courses = array();
					}
				}
				
				// Method 3: Get from post meta (LearnDash stores courses here)
				if ( empty( $group_courses ) ) {
					$course_ids = get_post_meta( $group_id, 'learndash_group_enrolled_courses', true );
					if ( is_array( $course_ids ) && ! empty( $course_ids ) ) {
						$group_courses = $course_ids;
					} elseif ( is_numeric( $course_ids ) && $course_ids > 0 ) {
						// Sometimes it's stored as a single ID
						$group_courses = array( $course_ids );
					}
				}
				
				// Method 4: Check for individual course meta keys (from create_team fallback)
				if ( empty( $group_courses ) ) {
					global $wpdb;
					$meta_keys = $wpdb->get_col( $wpdb->prepare(
						"SELECT meta_key FROM {$wpdb->postmeta} 
						 WHERE post_id = %d 
						 AND meta_key LIKE 'learndash_group_enrolled_%%'",
						$group_id
					) );
					
					foreach ( $meta_keys as $meta_key ) {
						$course_id = str_replace( 'learndash_group_enrolled_', '', $meta_key );
						if ( is_numeric( $course_id ) && $course_id > 0 ) {
							$group_courses[] = intval( $course_id );
						}
					}
				}
				
				// Method 5: Try other common meta keys
				if ( empty( $group_courses ) ) {
					$meta_keys = array(
						'learndash_group_courses',
						'ld_group_courses',
						'group_courses',
						'_ld_group_courses',
					);
					foreach ( $meta_keys as $meta_key ) {
						$course_ids = get_post_meta( $group_id, $meta_key, true );
						if ( is_array( $course_ids ) && ! empty( $course_ids ) ) {
							$group_courses = $course_ids;
							break;
						} elseif ( is_numeric( $course_ids ) && $course_ids > 0 ) {
							$group_courses = array( $course_ids );
							break;
						}
					}
				}
				
				if ( ! empty( $group_courses ) ) {
					// Ensure all course IDs are integers
					$group_courses = array_map( 'intval', $group_courses );
					$group_courses = array_filter( $group_courses ); // Remove zeros
					$group_courses = array_unique( $group_courses ); // Remove duplicates
					
					// Count how many members completed at least one of the team's courses
					$completed_members = 0;
					$total_progress_sum = 0;
					$members_with_progress = 0;
					
					foreach ( $group_users as $user_id ) {
						$user_completed_any = false;
						$user_progress_sum = 0;
						$user_courses_count = 0;
						
						// Check completion and progress for each team course
						foreach ( $group_courses as $course_id ) {
							// Verify course exists and is published
							$course = get_post( $course_id );
							if ( ! $course || $course->post_status !== 'publish' ) {
								continue;
							}
							
							// Check if user is enrolled in this course
							$user_enrolled = false;
							if ( function_exists( 'learndash_user_get_enrolled_courses' ) ) {
								$user_courses = learndash_user_get_enrolled_courses( $user_id, array(), true );
								$user_enrolled = in_array( $course_id, $user_courses );
							}
							
							// Only check progress if user is enrolled
							if ( $user_enrolled ) {
								// Check completion first (most reliable)
								if ( function_exists( 'learndash_course_completed' ) ) {
									$is_completed = learndash_course_completed( $user_id, $course_id );
									if ( $is_completed ) {
										$user_completed_any = true;
										$user_progress_sum += 100; // Completed = 100%
										$user_courses_count++;
									} else {
										// Get progress percentage if not completed
										if ( function_exists( 'learndash_course_progress' ) ) {
											$progress_data = learndash_course_progress( array(
												'user_id' => $user_id,
												'course_id' => $course_id,
												'array' => true
											) );
											
											if ( isset( $progress_data['percentage'] ) && is_numeric( $progress_data['percentage'] ) ) {
												$user_progress_sum += floatval( $progress_data['percentage'] );
												$user_courses_count++;
											}
										}
									}
								} else {
									// Fallback: Use progress only
									if ( function_exists( 'learndash_course_progress' ) ) {
										$progress_data = learndash_course_progress( array(
											'user_id' => $user_id,
											'course_id' => $course_id,
											'array' => true
										) );
										
										if ( isset( $progress_data['percentage'] ) && is_numeric( $progress_data['percentage'] ) ) {
											$progress_percentage = floatval( $progress_data['percentage'] );
											$user_progress_sum += $progress_percentage;
											$user_courses_count++;
											
											// Consider 100% as completed
											if ( $progress_percentage >= 100 ) {
												$user_completed_any = true;
											}
										}
									}
								}
							}
						}
						
						if ( $user_completed_any ) {
							$completed_members++;
						}
						
						// Calculate average progress for this user across team courses
						if ( $user_courses_count > 0 ) {
							$total_progress_sum += ( $user_progress_sum / $user_courses_count );
							$members_with_progress++;
						}
					}
					
					// Calculate progress: Prioritize completion rate, fallback to average progress
					if ( $completed_members > 0 ) {
						// Primary: Percentage of members who completed the course
						$progress = round( ( $completed_members / $total_members ) * 100 );
					} elseif ( $members_with_progress > 0 ) {
						// Fallback: Average progress percentage across all members
						$progress = round( $total_progress_sum / $members_with_progress );
					} else {
						$progress = 0;
					}
				} else {
					// No courses found - progress is 0
					$progress = 0;
				}
			}
			
			// Get group status (using custom meta or default to active)
			$status = get_post_meta( $group_id, 'group_status', true );
			if ( empty( $status ) ) {
				$status = 'Active';
			}
			
			// Filter by status if needed
			if ( $status_filter !== 'all' && strtolower( $status ) !== strtolower( $status_filter ) ) {
				continue;
			}
			
			// Generate avatar initials from group name
			$name_parts = explode( ' ', $group->post_title );
			$avatar = '';
			foreach ( $name_parts as $part ) {
				if ( ! empty( $part ) ) {
					$avatar .= strtoupper( substr( $part, 0, 1 ) );
					if ( strlen( $avatar ) >= 2 ) break;
				}
			}
			if ( strlen( $avatar ) < 2 && ! empty( $group->post_title ) ) {
				$avatar = strtoupper( substr( $group->post_title, 0, 2 ) );
			}
			
			$teams[] = array(
				'id' => $group_id,
				'name' => $group->post_title,
				'avatar' => $avatar,
				'facilitators' => $facilitators_count,
				'members' => $total_members,
				'progress' => $progress,
				'status' => $status,
				'created' => date( 'm/d/Y', strtotime( $group->post_date ) ),
			);
		}
		
		$response = array(
			'success' => true,
			'teams' => $teams,
			'pagination' => array(
				'current_page' => $page,
				'per_page' => $per_page,
				'total_items' => $query->found_posts,
				'total_pages' => $query->max_num_pages,
			),
		);
		
		return new WP_REST_Response( $response, 200 );
	}
	
	/**
	 * Create team
	 */
	public function create_team( $request ) {
		try {
			// Get JSON body
			$body = json_decode( $request->get_body(), true );
			
			if ( json_last_error() !== JSON_ERROR_NONE ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Invalid JSON in request body.',
				), 400 );
			}
			
			// Get request parameters from JSON body
			$name = isset( $body['name'] ) ? sanitize_text_field( $body['name'] ) : '';
			$course_ids = isset( $body['course_ids'] ) && is_array( $body['course_ids'] ) ? $body['course_ids'] : array();
			$description = isset( $body['description'] ) ? sanitize_textarea_field( $body['description'] ) : '';
			$learner_ids = isset( $body['learner_ids'] ) ? $body['learner_ids'] : array();
			$facilitator_ids = isset( $body['facilitator_ids'] ) && is_array( $body['facilitator_ids'] ) ? $body['facilitator_ids'] : array();

			// Validate required fields
			if ( empty( $name ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Team name is required.',
				), 400 );
			}

			if ( empty( $course_ids ) || ! is_array( $course_ids ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'At least one course is required.',
				), 400 );
			}

			if ( empty( $learner_ids ) || ! is_array( $learner_ids ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'At least one learner is required.',
				), 400 );
			}

			global $wpdb;

			// FAST: Batch validate courses - single query
			$course_ids_int = array_map( 'intval', array_filter( array_unique( $course_ids ) ) );
			if ( empty( $course_ids_int ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No valid course IDs provided.',
				), 400 );
			}

			$course_placeholders = implode( ',', array_fill( 0, count( $course_ids_int ), '%d' ) );
			$valid_course_ids = $wpdb->get_col( $wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts} 
				 WHERE ID IN ($course_placeholders) 
				 AND post_type = 'sfwd-courses' 
				 AND post_status = 'publish'",
				...$course_ids_int
			) );
			$valid_course_ids = array_map( 'intval', $valid_course_ids );

			if ( empty( $valid_course_ids ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No valid courses found.',
				), 400 );
			}

			// FAST: Batch validate learners - single query
			$learner_ids_int = array_map( 'intval', array_filter( array_unique( $learner_ids ) ) );
			if ( empty( $learner_ids_int ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No valid learner IDs provided.',
				), 400 );
			}

			$learner_placeholders = implode( ',', array_fill( 0, count( $learner_ids_int ), '%d' ) );
			$valid_learner_ids = $wpdb->get_col( $wpdb->prepare(
				"SELECT ID FROM {$wpdb->users} WHERE ID IN ($learner_placeholders)",
				...$learner_ids_int
			) );
			$valid_learner_ids = array_map( 'intval', $valid_learner_ids );

			if ( empty( $valid_learner_ids ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No valid learners found.',
				), 400 );
			}

			// FAST: Batch validate facilitators - single query (optional)
			$valid_facilitator_ids = array();
			if ( ! empty( $facilitator_ids ) ) {
				$facilitator_ids_int = array_map( 'intval', array_filter( array_unique( $facilitator_ids ) ) );
				if ( ! empty( $facilitator_ids_int ) ) {
					$facilitator_placeholders = implode( ',', array_fill( 0, count( $facilitator_ids_int ), '%d' ) );
					$valid_facilitator_ids = $wpdb->get_col( $wpdb->prepare(
						"SELECT ID FROM {$wpdb->users} WHERE ID IN ($facilitator_placeholders)",
						...$facilitator_ids_int
					) );
					$valid_facilitator_ids = array_map( 'intval', $valid_facilitator_ids );
				}
			}

			// Create LearnDash group
			$group_id = wp_insert_post( array(
				'post_type'    => 'groups',
				'post_title'   => $name,
				'post_content' => $description ? $description : '',
				'post_status'  => 'publish',
				'post_author'  => get_current_user_id(),
			), true );

			if ( is_wp_error( $group_id ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Failed to create team: ' . $group_id->get_error_message(),
				), 500 );
			}

			// FAST: Associate courses with group (single call)
			if ( function_exists( 'learndash_set_group_enrolled_courses' ) ) {
				learndash_set_group_enrolled_courses( $group_id, $valid_course_ids );
			} else {
				// FAST: Batch insert course meta
				$time = time();
				$values = array();
				foreach ( $valid_course_ids as $course_id ) {
					$values[] = $wpdb->prepare( "(%d, %s, %d)", $group_id, 'learndash_group_enrolled_' . $course_id, $time );
				}
				if ( ! empty( $values ) ) {
					$wpdb->query( "INSERT INTO {$wpdb->postmeta} (post_id, meta_key, meta_value) VALUES " . implode( ',', $values ) );
				}
			}

			// FAST: Add learners to group using direct database operations
			// This is much faster than calling ld_update_group_access for each user
			if ( ! empty( $valid_learner_ids ) ) {
				// Disable object cache temporarily for bulk operations
				wp_suspend_cache_addition( true );
				
				// Use LearnDash function if available, but in a more efficient way
				if ( function_exists( 'ld_update_group_access' ) ) {
					// Process in smaller batches to avoid timeout
					$batch_size = 20;
					$batches = array_chunk( $valid_learner_ids, $batch_size );
					
					foreach ( $batches as $batch ) {
						foreach ( $batch as $user_id ) {
							ld_update_group_access( $user_id, $group_id, false );
						}
					}
				} else {
					// Direct database operation (fastest)
					$time = time();
					$values = array();
					foreach ( $valid_learner_ids as $user_id ) {
						$values[] = $wpdb->prepare( "(%d, %s, %d)", $user_id, 'learndash_group_users_' . $group_id, $time );
					}
					if ( ! empty( $values ) ) {
						$wpdb->query( "INSERT IGNORE INTO {$wpdb->usermeta} (user_id, meta_key, meta_value) VALUES " . implode( ',', $values ) );
					}
				}
				
				wp_suspend_cache_addition( false );
			}

			// FAST: Add facilitators as group leaders (single call if possible)
			if ( ! empty( $valid_facilitator_ids ) ) {
				if ( function_exists( 'learndash_set_groups_administrators' ) ) {
					learndash_set_groups_administrators( $group_id, $valid_facilitator_ids );
				} elseif ( function_exists( 'ld_update_group_leader_access' ) ) {
					foreach ( $valid_facilitator_ids as $facilitator_id ) {
						ld_update_group_leader_access( $facilitator_id, $group_id, false );
					}
				} else {
					// Direct database operation
					$time = time();
					$values = array();
					foreach ( $valid_facilitator_ids as $facilitator_id ) {
						$values[] = $wpdb->prepare( "(%d, %s, %d)", $facilitator_id, 'learndash_group_leaders_' . $group_id, $time );
					}
					if ( ! empty( $values ) ) {
						$wpdb->query( "INSERT IGNORE INTO {$wpdb->usermeta} (user_id, meta_key, meta_value) VALUES " . implode( ',', $values ) );
					}
				}
			}

			// CRITICAL OPTIMIZATION: Skip manual course enrollment
			// LearnDash automatically enrolls group members in group courses
			// This nested loop is the main performance bottleneck
			// Removing it should reduce creation time from 60s to <5s

			// Build team response object
			$team = array(
				'id'           => $group_id,
				'name'         => $name,
				'avatar'       => (string) count( $valid_learner_ids ),
				'facilitators' => count( $valid_facilitator_ids ),
				'members'      => count( $valid_learner_ids ),
				'progress'     => 0,
				'status'       => 'Active',
				'created'      => current_time( 'Y-m-d' ),
			);

			return new WP_REST_Response( array(
				'success' => true,
				'message' => 'Team created successfully',
				'team_id' => $group_id,
				'team'    => $team,
			), 201 );

		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while creating the team.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Get team details
	 */
	public function get_team_details( $request ) {
		try {
			$team_id = intval( $request->get_param( 'id' ) );
			
			// Get team data
			$team = get_post( $team_id );
			if ( ! $team || $team->post_type !== 'groups' ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Team not found.',
				), 404 );
			}

			// Get group courses - use multiple fallback methods (same as get_teams_list)
			$course_ids = array();
			
			// Method 1: Use LearnDash function (most common)
			if ( function_exists( 'learndash_get_group_courses' ) ) {
				$course_ids = learndash_get_group_courses( $team_id );
				if ( ! is_array( $course_ids ) ) {
					$course_ids = array();
				}
			}
			
			// Method 2: Try alternative LearnDash function
			if ( empty( $course_ids ) && function_exists( 'learndash_group_enrolled_courses' ) ) {
				$course_ids = learndash_group_enrolled_courses( $team_id );
				if ( ! is_array( $course_ids ) ) {
					$course_ids = array();
				}
			}
			
			// Method 3: Get from post meta (LearnDash stores courses here)
			if ( empty( $course_ids ) ) {
				$course_ids_meta = get_post_meta( $team_id, 'learndash_group_enrolled_courses', true );
				if ( is_array( $course_ids_meta ) && ! empty( $course_ids_meta ) ) {
					$course_ids = $course_ids_meta;
				} elseif ( is_numeric( $course_ids_meta ) && $course_ids_meta > 0 ) {
					$course_ids = array( $course_ids_meta );
				}
			}
			
			// Method 4: Check for individual course meta keys (from create_team fallback)
			if ( empty( $course_ids ) ) {
				global $wpdb;
				$meta_keys = $wpdb->get_col( $wpdb->prepare(
					"SELECT meta_key FROM {$wpdb->postmeta} 
					 WHERE post_id = %d 
					 AND meta_key LIKE 'learndash_group_enrolled_%%'",
					$team_id
				) );
				foreach ( $meta_keys as $meta_key ) {
					$course_id = str_replace( 'learndash_group_enrolled_', '', $meta_key );
					if ( is_numeric( $course_id ) && $course_id > 0 ) {
						$course_ids[] = intval( $course_id );
					}
				}
			}
			
			// Method 5: Try other common meta keys
			if ( empty( $course_ids ) ) {
				$meta_keys = array(
					'learndash_group_courses',
					'ld_group_courses',
					'group_courses',
					'_ld_group_courses',
				);
				foreach ( $meta_keys as $meta_key ) {
					$course_ids_meta = get_post_meta( $team_id, $meta_key, true );
					if ( is_array( $course_ids_meta ) && ! empty( $course_ids_meta ) ) {
						$course_ids = $course_ids_meta;
						break;
					} elseif ( is_numeric( $course_ids_meta ) && $course_ids_meta > 0 ) {
						$course_ids = array( $course_ids_meta );
						break;
					}
				}
			}
			
			// Clean course IDs
			if ( ! empty( $course_ids ) ) {
				$course_ids = array_map( 'intval', $course_ids );
				$course_ids = array_filter( $course_ids );
				$course_ids = array_unique( $course_ids );
			}

			// Get group members (learners)
			$member_ids = array();
			if ( function_exists( 'learndash_get_groups_user_ids' ) ) {
				$member_ids = learndash_get_groups_user_ids( $team_id );
				if ( ! is_array( $member_ids ) ) {
					$member_ids = array();
				}
			}

			// Get group administrators (facilitators) with details
			$facilitator_ids = array();
			$facilitators = array();
			if ( function_exists( 'learndash_get_groups_administrator_ids' ) ) {
				$facilitator_ids = learndash_get_groups_administrator_ids( $team_id );
				if ( ! is_array( $facilitator_ids ) ) {
					$facilitator_ids = array();
				}
				
				// Get facilitator details
				foreach ( $facilitator_ids as $facilitator_id ) {
					$facilitator_user = get_userdata( $facilitator_id );
					if ( $facilitator_user ) {
						$avatar_url = get_avatar_url( $facilitator_id, array( 'size' => 96 ) );
						$facilitators[] = array(
							'id' => $facilitator_id,
							'display_name' => $facilitator_user->display_name,
							'avatar_url' => $avatar_url ? $avatar_url : '',
						);
					}
				}
			}

			return new WP_REST_Response( array(
				'success' => true,
				'team' => array(
					'id' => $team_id,
					'name' => $team->post_title,
					'description' => $team->post_content,
					'course_ids' => $course_ids,
					'learner_ids' => array_map( 'intval', $member_ids ),
					'facilitator_ids' => array_map( 'intval', $facilitator_ids ),
					'facilitators' => $facilitators,
				),
			), 200 );

		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching team details.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Update team
	 */
	public function update_team( $request ) {
		try {
			$team_id = intval( $request->get_param( 'id' ) );
			
			// Get team data
			$team = get_post( $team_id );
			if ( ! $team || $team->post_type !== 'groups' ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Team not found.',
				), 404 );
			}

			// Get JSON body
			$body = json_decode( $request->get_body(), true );
			
			if ( json_last_error() !== JSON_ERROR_NONE ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Invalid JSON in request body.',
				), 400 );
			}
			
			// Get request parameters from JSON body
			$name = isset( $body['name'] ) ? sanitize_text_field( $body['name'] ) : '';
			$course_ids = isset( $body['course_ids'] ) && is_array( $body['course_ids'] ) ? $body['course_ids'] : array();
			$description = isset( $body['description'] ) ? sanitize_textarea_field( $body['description'] ) : '';
			$learner_ids = isset( $body['learner_ids'] ) ? $body['learner_ids'] : array();
			$facilitator_ids = isset( $body['facilitator_ids'] ) && is_array( $body['facilitator_ids'] ) ? $body['facilitator_ids'] : array();

			// Validate required fields
			if ( empty( $name ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Team name is required.',
				), 400 );
			}

			if ( empty( $course_ids ) || ! is_array( $course_ids ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'At least one course is required.',
				), 400 );
			}

			if ( empty( $learner_ids ) || ! is_array( $learner_ids ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'At least one learner is required.',
				), 400 );
			}

			global $wpdb;

			// FAST: Batch validate courses - single query
			$course_ids_int = array_map( 'intval', array_filter( array_unique( $course_ids ) ) );
			if ( empty( $course_ids_int ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No valid course IDs provided.',
				), 400 );
			}

			$course_placeholders = implode( ',', array_fill( 0, count( $course_ids_int ), '%d' ) );
			$valid_course_ids = $wpdb->get_col( $wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts} 
				 WHERE ID IN ($course_placeholders) 
				 AND post_type = 'sfwd-courses' 
				 AND post_status = 'publish'",
				...$course_ids_int
			) );
			$valid_course_ids = array_map( 'intval', $valid_course_ids );

			if ( empty( $valid_course_ids ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No valid courses found.',
				), 400 );
			}

			// FAST: Batch validate learners - single query
			$learner_ids_int = array_map( 'intval', array_filter( array_unique( $learner_ids ) ) );
			if ( empty( $learner_ids_int ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No valid learner IDs provided.',
				), 400 );
			}

			$learner_placeholders = implode( ',', array_fill( 0, count( $learner_ids_int ), '%d' ) );
			$valid_learner_ids = $wpdb->get_col( $wpdb->prepare(
				"SELECT ID FROM {$wpdb->users} WHERE ID IN ($learner_placeholders)",
				...$learner_ids_int
			) );
			$valid_learner_ids = array_map( 'intval', $valid_learner_ids );

			if ( empty( $valid_learner_ids ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No valid learners found.',
				), 400 );
			}

			// FAST: Batch validate facilitators - single query (optional)
			$valid_facilitator_ids = array();
			if ( ! empty( $facilitator_ids ) ) {
				$facilitator_ids_int = array_map( 'intval', array_filter( array_unique( $facilitator_ids ) ) );
				if ( ! empty( $facilitator_ids_int ) ) {
					$facilitator_placeholders = implode( ',', array_fill( 0, count( $facilitator_ids_int ), '%d' ) );
					$valid_facilitator_ids = $wpdb->get_col( $wpdb->prepare(
						"SELECT ID FROM {$wpdb->users} WHERE ID IN ($facilitator_placeholders)",
						...$facilitator_ids_int
					) );
					$valid_facilitator_ids = array_map( 'intval', $valid_facilitator_ids );
				}
			}

			// Update team post
			$update_result = wp_update_post( array(
				'ID'           => $team_id,
				'post_title'   => $name,
				'post_content' => $description ? $description : '',
			), true );

			if ( is_wp_error( $update_result ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Failed to update team: ' . $update_result->get_error_message(),
				), 500 );
			}

			// FAST: Get current group members (single call)
			$current_member_ids = array();
			if ( function_exists( 'learndash_get_groups_user_ids' ) ) {
				$current_member_ids = learndash_get_groups_user_ids( $team_id );
				if ( ! is_array( $current_member_ids ) ) {
					$current_member_ids = array();
				}
			}
			$current_member_ids = array_map( 'intval', $current_member_ids );

			// Calculate members to add/remove
			$members_to_remove = array_diff( $current_member_ids, $valid_learner_ids );
			$members_to_add = array_diff( $valid_learner_ids, $current_member_ids );

			// FAST: Remove members that are no longer in the list
			if ( ! empty( $members_to_remove ) ) {
				wp_suspend_cache_addition( true );
				
				if ( function_exists( 'ld_update_group_access' ) ) {
					// Process in batches
					$batches = array_chunk( $members_to_remove, 20 );
					foreach ( $batches as $batch ) {
						foreach ( $batch as $user_id ) {
							ld_update_group_access( $user_id, $team_id, true ); // true = remove
						}
					}
				} else {
					// Direct database operation
					$placeholders = implode( ',', array_fill( 0, count( $members_to_remove ), '%d' ) );
					$wpdb->query( $wpdb->prepare(
						"DELETE FROM {$wpdb->usermeta} 
						 WHERE user_id IN ($placeholders) 
						 AND meta_key = %s",
						...array_merge( $members_to_remove, array( 'learndash_group_users_' . $team_id ) )
					) );
				}
				
				wp_suspend_cache_addition( false );
			}

			// FAST: Add new members
			if ( ! empty( $members_to_add ) ) {
				wp_suspend_cache_addition( true );
				
				if ( function_exists( 'ld_update_group_access' ) ) {
					// Process in batches
					$batches = array_chunk( $members_to_add, 20 );
					foreach ( $batches as $batch ) {
						foreach ( $batch as $user_id ) {
							ld_update_group_access( $user_id, $team_id, false ); // false = add
						}
					}
				} else {
					// Direct database operation
					$time = time();
					$values = array();
					foreach ( $members_to_add as $user_id ) {
						$values[] = $wpdb->prepare( "(%d, %s, %d)", $user_id, 'learndash_group_users_' . $team_id, $time );
					}
					if ( ! empty( $values ) ) {
						$wpdb->query( "INSERT IGNORE INTO {$wpdb->usermeta} (user_id, meta_key, meta_value) VALUES " . implode( ',', $values ) );
					}
				}
				
				wp_suspend_cache_addition( false );
			}

			// FAST: Update course associations (single call)
			if ( function_exists( 'learndash_set_group_enrolled_courses' ) ) {
				learndash_set_group_enrolled_courses( $team_id, $valid_course_ids );
			} else {
				// Fallback: Remove old courses and add new ones
				// Get old courses
				$old_courses = array();
				if ( function_exists( 'learndash_get_group_courses' ) ) {
					$old_courses = learndash_get_group_courses( $team_id );
					if ( ! is_array( $old_courses ) ) {
						$old_courses = array();
					}
				}
				
				// FAST: Batch delete old course meta
				if ( ! empty( $old_courses ) ) {
					$old_placeholders = implode( ',', array_fill( 0, count( $old_courses ), '%s' ) );
					$wpdb->query( $wpdb->prepare(
						"DELETE FROM {$wpdb->postmeta} 
						 WHERE post_id = %d 
						 AND meta_key IN ($old_placeholders)",
						$team_id,
						...array_map( function( $id ) { return 'learndash_group_enrolled_' . $id; }, $old_courses )
					) );
				}
				
				// FAST: Batch insert new course meta
				$time = time();
				$values = array();
				foreach ( $valid_course_ids as $course_id ) {
					$values[] = $wpdb->prepare( "(%d, %s, %d)", $team_id, 'learndash_group_enrolled_' . $course_id, $time );
				}
				if ( ! empty( $values ) ) {
					$wpdb->query( "INSERT INTO {$wpdb->postmeta} (post_id, meta_key, meta_value) VALUES " . implode( ',', $values ) . " ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)" );
				}
			}

			// FAST: Update facilitators (group leaders)
			if ( function_exists( 'learndash_set_groups_administrators' ) ) {
				learndash_set_groups_administrators( $team_id, $valid_facilitator_ids );
			} elseif ( function_exists( 'ld_update_group_leader_access' ) ) {
				// Get current facilitators
				$current_facilitator_ids = array();
				if ( function_exists( 'learndash_get_groups_administrator_ids' ) ) {
					$current_facilitator_ids = learndash_get_groups_administrator_ids( $team_id );
					if ( ! is_array( $current_facilitator_ids ) ) {
						$current_facilitator_ids = array();
					}
				}
				$current_facilitator_ids = array_map( 'intval', $current_facilitator_ids );
				
				// Calculate facilitators to add/remove
				$facilitators_to_remove = array_diff( $current_facilitator_ids, $valid_facilitator_ids );
				$facilitators_to_add = array_diff( $valid_facilitator_ids, $current_facilitator_ids );
				
				// Remove old facilitators
				foreach ( $facilitators_to_remove as $facilitator_id ) {
					ld_update_group_leader_access( $facilitator_id, $team_id, true ); // true = remove
				}
				
				// Add new facilitators
				foreach ( $facilitators_to_add as $facilitator_id ) {
					ld_update_group_leader_access( $facilitator_id, $team_id, false ); // false = add
				}
			} else {
				// Direct database operation
				$current_facilitator_ids = array();
				if ( function_exists( 'learndash_get_groups_administrator_ids' ) ) {
					$current_facilitator_ids = learndash_get_groups_administrator_ids( $team_id );
					if ( ! is_array( $current_facilitator_ids ) ) {
						$current_facilitator_ids = array();
					}
				}
				$current_facilitator_ids = array_map( 'intval', $current_facilitator_ids );
				
				$facilitators_to_remove = array_diff( $current_facilitator_ids, $valid_facilitator_ids );
				$facilitators_to_add = array_diff( $valid_facilitator_ids, $current_facilitator_ids );
				
				// Batch remove
				if ( ! empty( $facilitators_to_remove ) ) {
					$placeholders = implode( ',', array_fill( 0, count( $facilitators_to_remove ), '%d' ) );
					$wpdb->query( $wpdb->prepare(
						"DELETE FROM {$wpdb->usermeta} 
						 WHERE user_id IN ($placeholders) 
						 AND meta_key = %s",
						...array_merge( $facilitators_to_remove, array( 'learndash_group_leaders_' . $team_id ) )
					) );
				}
				
				// Batch add
				if ( ! empty( $facilitators_to_add ) ) {
					$time = time();
					$values = array();
					foreach ( $facilitators_to_add as $facilitator_id ) {
						$values[] = $wpdb->prepare( "(%d, %s, %d)", $facilitator_id, 'learndash_group_leaders_' . $team_id, $time );
					}
					if ( ! empty( $values ) ) {
						$wpdb->query( "INSERT IGNORE INTO {$wpdb->usermeta} (user_id, meta_key, meta_value) VALUES " . implode( ',', $values ) );
					}
				}
			}

			return new WP_REST_Response( array(
				'success' => true,
				'message' => 'Team updated successfully',
				'team_id' => $team_id,
			), 200 );

		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while updating the team.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Delete team
	 */
	public function delete_team( $request ) {
		try {
			$team_id = $request->get_param( 'id' );
			
			// Get team data before deletion
			$team = get_post( $team_id );
			
			if ( ! $team || $team->post_type !== 'groups' ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Team not found.',
				), 404 );
			}
			
			// Store team info for response
			$team_name = $team->post_title;
			$team_members = learndash_get_groups_user_ids( $team_id );
			$member_count = count( $team_members );
			
			// Remove all users from the group before deletion
			if ( ! empty( $team_members ) && function_exists( 'ld_update_group_access' ) ) {
				foreach ( $team_members as $user_id ) {
					ld_update_group_access( $user_id, $team_id, true ); // true = remove access
				}
			}
			
			// Delete the group post
			$result = wp_delete_post( $team_id, true ); // true = force delete (skip trash)
			
			if ( ! $result ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Failed to delete team. Please try again.',
				), 500 );
			}
			
			return new WP_REST_Response( array(
				'success' => true,
				'message' => 'Team deleted successfully',
				'deleted_team_id' => $team_id,
				'deleted_team_name' => $team_name,
				'removed_members' => $member_count,
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while deleting the team.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Get team members
	 */
	public function get_team_members( $request ) {
		try {
			$team_id = $request->get_param( 'id' );
			
			// Get team data
			$team = get_post( $team_id );
			
			if ( ! $team || $team->post_type !== 'groups' ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Team not found.',
				), 404 );
			}
			
			// Get group users
			$member_ids = learndash_get_groups_user_ids( $team_id );
			$members = array();
			
			if ( ! empty( $member_ids ) ) {
				foreach ( $member_ids as $user_id ) {
					$user = get_userdata( $user_id );
					
					if ( ! $user ) continue;
					
					// Get user's last login
					$last_login = get_user_meta( $user_id, 'last_login', true );
					$last_activity = $last_login ? human_time_diff( $last_login, current_time( 'timestamp' ) ) . ' ago' : 'Never';
					
					// Determine if active (logged in within last 30 days)
					$days_since_login = $last_login ? floor( ( time() - $last_login ) / ( 60 * 60 * 24 ) ) : 999;
					$status = ( $days_since_login <= 30 ) ? 'Active' : 'Inactive';
					
					// Get user role
					// Correct mappings: group_leader = Facilitator, group_leader_clone = Manager
					$roles = $user->roles;
					$role = 'Learner'; // Default
					if ( in_array( 'group_leader', $roles ) ) {
						$role = 'Facilitator';
					} elseif ( in_array( 'group_leader_clone', $roles ) ) {
						$role = 'Manager';
					} elseif ( in_array( 'subscriber', $roles ) ) {
						$role = 'Learner';
					}
					
					// Get join date (when added to group)
					$join_date = get_user_meta( $user_id, 'ld_group_' . $team_id . '_joined', true );
					if ( ! $join_date ) {
						$join_date = $user->user_registered;
					}
					
					$members[] = array(
						'id' => $user_id,
						'name' => $user->display_name,
						'email' => $user->user_email,
						'avatar' => strtoupper( substr( $user->display_name, 0, 2 ) ),
						'role' => $role,
						'joinDate' => date( 'm/d/Y', strtotime( $join_date ) ),
						'lastActivity' => $last_activity,
						'status' => $status,
					);
				}
			}
			
			return new WP_REST_Response( array(
				'success' => true,
				'members' => $members,
				'total' => count( $members ),
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching team members.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Remove team member
	 */
	public function remove_team_member( $request ) {
		try {
			$team_id = $request->get_param( 'team_id' );
			$user_id = $request->get_param( 'user_id' );
			
			// Validate team exists
			$team = get_post( $team_id );
			if ( ! $team || $team->post_type !== 'groups' ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Team not found.',
				), 404 );
			}
			
			// Validate user exists
			$user = get_userdata( $user_id );
			if ( ! $user ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not found.',
				), 404 );
			}
			
			// Remove user from group
			if ( function_exists( 'ld_update_group_access' ) ) {
				ld_update_group_access( $user_id, $team_id, true ); // true = remove
			}
			
			return new WP_REST_Response( array(
				'success' => true,
				'message' => 'Member removed from team successfully',
				'removed_user_id' => $user_id,
				'removed_user_name' => $user->display_name,
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while removing the member.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	// ============================================
	// COURSE ENDPOINTS
	// ============================================
	
	/**
	 * Get courses list
	 */
	public function get_courses_list( $request ) {
		try {
			// Check if LearnDash is active
			if ( ! class_exists( 'SFWD_LMS' ) ) {
				return new WP_REST_Response( array(
					'error' => true,
					'message' => 'LearnDash is not active.',
					'courses' => array(),
					'total' => 0,
					'total_pages' => 0,
					'current_page' => 1,
				), 200 );
			}
			
			$page = $request->get_param( 'page' ) ? intval( $request->get_param( 'page' ) ) : 1;
			$per_page = $request->get_param( 'per_page' ) ? intval( $request->get_param( 'per_page' ) ) : 100;
			$search = $request->get_param( 'search' );
			
			$args = array(
				'post_type' => 'sfwd-courses',
				'post_status' => 'publish',
				'posts_per_page' => $per_page,
				'paged' => $page,
				'orderby' => 'title',
				'order' => 'ASC',
			);
			
			if ( $search ) {
				$args['s'] = sanitize_text_field( $search );
			}
			
			$query = new WP_Query( $args );
			$courses = array();
			
			if ( $query->have_posts() ) {
				foreach ( $query->posts as $post ) {
					$course_id = $post->ID;
					
					// Safely get enrollment count
					$enrolled_count = 0;
					if ( function_exists( 'learndash_get_users_for_course' ) ) {
						$users = learndash_get_users_for_course( $course_id, array(), false );
						$enrolled_count = is_array( $users ) ? count( $users ) : 0;
					}
					
					$courses[] = array(
						'id' => $course_id,
						'title' => $post->post_title,
						'slug' => $post->post_name,
						'status' => $post->post_status,
						'enrolled_count' => $enrolled_count,
					);
				}
			}
			
			// Reset post data
			wp_reset_postdata();
			
			return new WP_REST_Response( array(
				'courses' => $courses,
				'total' => $query->found_posts,
				'total_pages' => $query->max_num_pages,
				'current_page' => $page,
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'error' => true,
				'message' => 'An error occurred while fetching courses.',
				'details' => $e->getMessage(),
				'courses' => array(),
				'total' => 0,
				'total_pages' => 0,
				'current_page' => 1,
			), 500 );
		}
	}
	
	/**
	 * Get course completion rate
	 */
/**
 * Get course completion rate
 */
public function get_course_completion_rate( $request ) {
	global $wpdb;
	
	try {
		// Validate LearnDash DB table exists
		$table = $wpdb->prefix . 'learndash_user_activity';
		$exists = $wpdb->get_var( $wpdb->prepare(
			"SHOW TABLES LIKE %s",
			$table
		) );
		if ( ! $exists ) {
			return new WP_REST_Response( array(
				'error' => true,
				'message' => 'LearnDash activity table not found.',
			), 404 );
		}
		
		// Get parameters
		$period = $request->get_param( 'period' ) ?: 'all';
		$from_date = $request->get_param( 'from' );
		$to_date = $request->get_param( 'to' );
		$where_clause = '';
		$timestamp_from = null;
		$timestamp_to = null;
		$use_date_range = false;
		
		// Check if custom date range is provided (takes precedence over period)
		if ( ! empty( $from_date ) && ! empty( $to_date ) ) {
			$use_date_range = true;
			// Parse ISO 8601 dates to Unix timestamps
			$timestamp_from = strtotime( $from_date );
			$timestamp_to = strtotime( $to_date );
			
			// LearnDash stores activity_started as Unix timestamp
			$where_clause = $wpdb->prepare( 
				" AND activity_started >= %d AND activity_started <= %d", 
				$timestamp_from,
				$timestamp_to
			);
		} elseif ( $period !== 'all' ) {
			// Build date filter based on period
			$current_date = current_time( 'timestamp' );
			
			switch ( $period ) {
				case '1month':
					$timestamp_from = strtotime( '-1 month', $current_date );
					break;
				case '3months':
					$timestamp_from = strtotime( '-3 months', $current_date );
					break;
				case '6months':
					$timestamp_from = strtotime( '-6 months', $current_date );
					break;
				case '1year':
					$timestamp_from = strtotime( '-1 year', $current_date );
					break;
			}
			
			if ( $timestamp_from ) {
				// LearnDash stores activity_started as Unix timestamp
				$where_clause = $wpdb->prepare( 
					" AND activity_started >= %d", 
					$timestamp_from 
				);
			}
		}
		
		// Get total published courses
		$total_courses = (int) $wpdb->get_var( "
			SELECT COUNT(ID)
			FROM {$wpdb->posts}
			WHERE post_type = 'sfwd-courses'
			  AND post_status = 'publish'
		" );
		
		// Count total unique users who started courses
		$total_enrolled = (int) $wpdb->get_var( "
			SELECT COUNT(DISTINCT user_id)
			FROM {$table}
			WHERE activity_type = 'course'
			  AND user_id > 0
			{$where_clause}
		" );
		
		// Count total course enrollments (user-course pairs)
		$total_enrollments = (int) $wpdb->get_var( "
			SELECT COUNT(DISTINCT CONCAT(user_id, '-', post_id))
			FROM {$table}
			WHERE activity_type = 'course'
			  AND user_id > 0
			  AND post_id > 0
			{$where_clause}
		" );
		
		// Count completed courses (must have activity_status = 1 AND activity_completed > 0)
		$completed_where = $where_clause;
		if ( $use_date_range ) {
			// For date range, check both activity_started and activity_completed within range
			$completed_where = $wpdb->prepare(
				" AND ((activity_started >= %d AND activity_started <= %d) OR (activity_completed >= %d AND activity_completed <= %d))",
				$timestamp_from,
				$timestamp_to,
				$timestamp_from,
				$timestamp_to
			);
		} elseif ( $period !== 'all' && $timestamp_from ) {
			// For completed, also check activity_completed date
			$completed_where = $wpdb->prepare(
				" AND (activity_started >= %d OR activity_completed >= %d)",
				$timestamp_from,
				$timestamp_from
			);
		}
		
		$total_completed = (int) $wpdb->get_var( "
			SELECT COUNT(DISTINCT CONCAT(user_id, '-', post_id))
			FROM {$table}
			WHERE activity_type = 'course'
			  AND activity_status = 1
			  AND user_id > 0
			  AND post_id > 0
			{$completed_where}
		" );
		
		// Calculate in-progress
		$in_progress = max( $total_enrollments - $total_completed, 0 );
		$total_enrollments_safe = max( $total_enrollments, 1 );
		
		$completed_percentage = round( ( $total_completed / $total_enrollments_safe ) * 100, 2 );
		$in_progress_percentage = round( ( $in_progress / $total_enrollments_safe ) * 100, 2 );
		
		// Build response
		$response = array(
			'period' => $use_date_range ? 'custom' : $period,
			'total_courses' => $total_courses,
			'total_enrolled' => $total_enrolled,
			'total_enrollments' => $total_enrollments,
			'completed' => array(
				'count' => $total_completed,
				'percentage' => $completed_percentage,
			),
			'in_progress' => array(
				'count' => $in_progress,
				'percentage' => $in_progress_percentage,
			),
		);
		
		// Add date range info to response if using custom range
		if ( $use_date_range ) {
			$response['date_range'] = array(
				'from' => date( 'Y-m-d H:i:s', $timestamp_from ),
				'to' => date( 'Y-m-d H:i:s', $timestamp_to ),
			);
		}
		
		return new WP_REST_Response( $response, 200 );
		
	} catch ( Exception $e ) {
		return new WP_REST_Response( array(
			'error' => true,
			'message' => 'Unexpected server error.',
			'details' => $e->getMessage(),
		), 500 );
	}
}
	
	/**
	 * Get top courses
	 */
/**
 * Get top courses
 */
public function get_top_courses( $request ) {
	global $wpdb;
	
	$table = $wpdb->prefix . 'learndash_user_activity';
	$exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $table ) );
	
	if ( ! $exists ) {
		return new WP_REST_Response( array(
			'error'   => true,
			'message' => 'LearnDash activity table not found.',
		), 404 );
	}
	
	// Get parameters
	$period = $request->get_param( 'period' ) ?: 'all';
	$from_date = $request->get_param( 'from' );
	$to_date = $request->get_param( 'to' );
	$where_clause = '';
	$timestamp_from = null;
	$timestamp_to = null;
	$use_date_range = false;
	
	// Check if custom date range is provided (takes precedence over period)
	if ( ! empty( $from_date ) && ! empty( $to_date ) ) {
		$use_date_range = true;
		// Parse ISO 8601 dates to Unix timestamps
		$timestamp_from = strtotime( $from_date );
		$timestamp_to = strtotime( $to_date );
		
		// LearnDash stores activity_started as Unix timestamp
		$where_clause = $wpdb->prepare( 
			" AND activity_started >= %d AND activity_started <= %d", 
			$timestamp_from,
			$timestamp_to
		);
	} elseif ( $period !== 'all' ) {
		// Build date filter based on period
		$current_date = current_time( 'timestamp' );
		
		switch ( $period ) {
			case '1month':
				$timestamp_from = strtotime( '-1 month', $current_date );
				break;
			case '3months':
				$timestamp_from = strtotime( '-3 months', $current_date );
				break;
			case '6months':
				$timestamp_from = strtotime( '-6 months', $current_date );
				break;
			case '1year':
				$timestamp_from = strtotime( '-1 year', $current_date );
				break;
		}
		
		if ( $timestamp_from ) {
			// LearnDash stores activity_started as Unix timestamp
			$where_clause = $wpdb->prepare( 
				" AND activity_started >= %d", 
				$timestamp_from 
			);
		}
	}
	
	// Aggregate enrollments for courses in the selected period
	$enrollments = $wpdb->get_results( "
		SELECT post_id AS course_id, COUNT(DISTINCT user_id) AS enrollments
		FROM {$table}
		WHERE activity_type = 'course'
		  AND user_id > 0
		  AND post_id > 0
		{$where_clause}
		GROUP BY post_id
		ORDER BY enrollments DESC
		LIMIT 5
	", ARRAY_A );
	
	// Build response
	$response = array(
		'period' => $use_date_range ? 'custom' : $period,
		'total_courses_found' => 0,
		'top_courses'         => array(),
	);
	
	// Add date range info to response if using custom range
	if ( $use_date_range ) {
		$response['date_range'] = array(
			'from' => date( 'Y-m-d H:i:s', $timestamp_from ),
			'to' => date( 'Y-m-d H:i:s', $timestamp_to ),
		);
	}
	
	if ( empty( $enrollments ) ) {
		return new WP_REST_Response( $response, 200 );
	}
	
	// Get details of top 5 courses
	$top_courses = array();
	foreach ( $enrollments as $row ) {
		$course_id = intval( $row['course_id'] );
		
		// Skip invalid or unpublished
		if ( get_post_status( $course_id ) !== 'publish' ) {
			continue;
		}
		
		// Get course categories
		$categories = wp_get_post_terms( $course_id, 'ld_course_category', array( 'fields' => 'names' ) );
		if ( is_wp_error( $categories ) ) {
			$categories = array();
		}
		
		$top_courses[] = array(
			'id'          => $course_id,
			'title'       => get_the_title( $course_id ),
			'enrollments' => intval( $row['enrollments'] ),
			'thumbnail'   => get_the_post_thumbnail_url( $course_id, 'medium' ) ?: '',
			'link'        => get_permalink( $course_id ),
			'category'    => $categories,
			'modified'    => get_the_modified_date( 'Y-m-d H:i:s', $course_id ),
		);
	}
	
	$response['total_courses_found'] = count( $top_courses );
	$response['top_courses'] = $top_courses;
	
	return new WP_REST_Response( $response, 200 );
}
	
	// ============================================
	// REPORT ENDPOINTS
	// ============================================
	
	/**
	 * Get course report
	 */
	public function get_course_report( $request ) {
		global $wpdb;

		try {
			// Validate LearnDash DB table exists
			$table = $wpdb->prefix . 'learndash_user_activity';
			$exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $table ) );
			
			if ( ! $exists ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'LearnDash activity table not found.',
				), 404 );
			}

			// Get query parameters
			$page = max( 1, intval( $request->get_param( 'page' ) ) ?: 1 );
			$per_page = max( 1, min( 100, intval( $request->get_param( 'per_page' ) ) ?: 10 ) );
			$search = sanitize_text_field( $request->get_param( 'search' ) ?: '' );
			$days = intval( $request->get_param( 'days' ) ) ?: 0; // 0 = all time

			// Get all published courses
			$course_args = array(
				'post_type'      => 'sfwd-courses',
				'post_status'    => 'publish',
				'posts_per_page' => -1,
				'fields'         => 'ids',
			);

			if ( $search ) {
				$course_args['s'] = $search;
			}

			$course_ids = get_posts( $course_args );
			
			if ( empty( $course_ids ) ) {
				return new WP_REST_Response( array(
					'success' => true,
					'data' => array(),
					'total' => 0,
					'page' => $page,
					'per_page' => $per_page,
				), 200 );
			}

			// Calculate pagination
			$total_courses = count( $course_ids );
			$offset = ( $page - 1 ) * $per_page;
			$paginated_course_ids = array_slice( $course_ids, $offset, $per_page );

			// Build course-to-certificate mapping and identify CPD certificates
			$course_certificate_map = array();
			$cpd_certificate_ids = array();
			
			// Determine certificate post type
			$certificate_post_type = 'sfwd-certificates';
			$cert_type_exists = $wpdb->get_var( $wpdb->prepare( "
				SELECT COUNT(*) 
				FROM {$wpdb->posts} 
				WHERE post_type = %s 
				LIMIT 1
			", $certificate_post_type ) );
			
			if ( ! $cert_type_exists ) {
				$certificate_post_type = 'certificates';
			}

			// Get all certificates and identify CPD certificates
			$all_certificates = $wpdb->get_results( $wpdb->prepare( "
				SELECT ID, post_title
				FROM {$wpdb->posts}
				WHERE post_type = %s
				AND post_status = 'publish'
			", $certificate_post_type ) );

			foreach ( $all_certificates as $cert ) {
				$cert_id = intval( $cert->ID );
				$title = strtolower( $cert->post_title );
				
				// Check if CPD certificate (by title or meta)
				$is_cpd = false;
				if ( strpos( $title, 'cpd' ) !== false ) {
					$is_cpd = true;
				} else {
					$cpd_meta = get_post_meta( $cert_id, 'is_cpd_certificate', true );
					if ( $cpd_meta === '1' || $cpd_meta === 'yes' || $cpd_meta === true || $cpd_meta === 1 ) {
						$is_cpd = true;
					}
				}
				
				if ( $is_cpd ) {
					$cpd_certificate_ids[] = $cert_id;
				}
			}

			// Get course-to-certificate mappings from simple meta keys
			$course_certs = $wpdb->get_results( "
				SELECT pm.post_id as course_id, pm.meta_value as certificate_id
				FROM {$wpdb->postmeta} pm
				INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
				WHERE p.post_type = 'sfwd-courses'
				AND p.post_status = 'publish'
				AND pm.meta_key IN ('certificate', 'sfwd_certificate', 'learndash_certificate', 'course_certificate')
				AND pm.meta_value != ''
				AND pm.meta_value != '0'
			" );

			foreach ( $course_certs as $row ) {
				$crs_id = intval( $row->course_id );
				$cert_id = intval( $row->certificate_id );
				if ( $cert_id > 0 ) {
					$course_certificate_map[$crs_id] = $cert_id;
				}
			}

			// Check serialized meta for certificate mappings
			$serialized_certs = $wpdb->get_results( "
				SELECT pm.post_id as course_id, pm.meta_value
				FROM {$wpdb->postmeta} pm
				INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
				WHERE p.post_type = 'sfwd-courses'
				AND p.post_status = 'publish'
				AND pm.meta_key = '_sfwd-courses'
			" );

			foreach ( $serialized_certs as $row ) {
				$meta_value = maybe_unserialize( $row->meta_value );
				if ( is_array( $meta_value ) ) {
					$cert_id = null;
					if ( isset( $meta_value['sfwd-courses_certificate'] ) ) {
						$cert_id = intval( $meta_value['sfwd-courses_certificate'] );
					} elseif ( isset( $meta_value['certificate'] ) ) {
						$cert_id = intval( $meta_value['certificate'] );
					}
					
					if ( $cert_id > 0 ) {
						$crs_id = intval( $row->course_id );
						$course_certificate_map[$crs_id] = $cert_id;
					}
				}
			}

			$courses_report = array();

			foreach ( $paginated_course_ids as $course_id ) {
				$course_title = get_the_title( $course_id );
				
				// Skip if search doesn't match course title
				if ( $search && stripos( $course_title, $search ) === false ) {
					continue;
				}

				// COMPREHENSIVE METHOD TO GET ALL ENROLLED USERS
				$enrolled_user_ids = array();
				
				// Check if this is an open course (available to all users)
				$course_price_type = learndash_get_course_meta_setting( $course_id, 'course_price_type' );
				
				if ( $course_price_type === 'open' ) {
					// For open courses, ALL users are considered enrolled
					$all_users = get_users( array( 'fields' => 'ids', 'number' => -1 ) );
					$enrolled_user_ids = $all_users;
				} else {
					// METHOD 1: Get directly enrolled users via course access meta
					$direct_enrolled = $wpdb->get_col( $wpdb->prepare( "
						SELECT DISTINCT user_id 
						FROM {$wpdb->usermeta}
						WHERE meta_key = %s
						AND meta_value != ''
						AND meta_value != '0'
					", 'course_' . $course_id . '_access_from' ) );
					
					if ( ! empty( $direct_enrolled ) ) {
						$enrolled_user_ids = array_merge( $enrolled_user_ids, $direct_enrolled );
					}
					
					// METHOD 2: Get users enrolled via course access list
					$access_list_users = $wpdb->get_col( $wpdb->prepare( "
						SELECT DISTINCT user_id 
						FROM {$wpdb->usermeta}
						WHERE meta_key = 'learndash_course_access_list'
						AND (
							meta_value LIKE %s
							OR meta_value LIKE %s
							OR meta_value LIKE %s
						)
					", 
						'%"' . $course_id . '"%',
						'%:' . $course_id . ';%',
						'%i:' . $course_id . ';%'
					) );
					
					if ( ! empty( $access_list_users ) ) {
						$enrolled_user_ids = array_merge( $enrolled_user_ids, $access_list_users );
					}
					
					// METHOD 3: Get group-enrolled users
					// First, find all groups that have this course
					$groups_with_course = $wpdb->get_col( $wpdb->prepare( "
						SELECT DISTINCT post_id 
						FROM {$wpdb->postmeta}
						WHERE (
							meta_key = %s
							OR (
								meta_key = 'learndash_group_enrolled_courses' 
								AND (
									meta_value LIKE %s
									OR meta_value LIKE %s
									OR meta_value LIKE %s
								)
							)
						)
					", 
						'learndash_group_enrolled_' . $course_id,
						'%"' . $course_id . '"%',
						'%:' . $course_id . ';%',
						'%i:' . $course_id . ';%'
					) );
					
					// Now get all users in those groups
					if ( ! empty( $groups_with_course ) ) {
						foreach ( $groups_with_course as $group_id ) {
							// Verify the group is published
							if ( get_post_status( $group_id ) !== 'publish' ) {
								continue;
							}
							
							// Get users in this group
							$group_users = $wpdb->get_col( $wpdb->prepare( "
								SELECT DISTINCT user_id 
								FROM {$wpdb->usermeta}
								WHERE meta_key = %s
								AND meta_value != ''
								AND meta_value != '0'
							", 'learndash_group_users_' . $group_id ) );
							
							if ( ! empty( $group_users ) ) {
								$enrolled_user_ids = array_merge( $enrolled_user_ids, $group_users );
							}
						}
					}
					
					// METHOD 4: Use LearnDash function if available (as additional check)
					if ( function_exists( 'learndash_get_course_groups' ) ) {
						$course_groups = learndash_get_course_groups( $course_id, true );
						if ( ! empty( $course_groups ) ) {
							foreach ( $course_groups as $group_id ) {
								if ( function_exists( 'learndash_get_groups_user_ids' ) ) {
									$group_users = learndash_get_groups_user_ids( $group_id );
									if ( is_array( $group_users ) && ! empty( $group_users ) ) {
										$enrolled_user_ids = array_merge( $enrolled_user_ids, $group_users );
									}
								}
							}
						}
					}
					
					// METHOD 5: Check for users with activity in this course (catch any missed enrollments)
					$activity_users = $wpdb->get_col( $wpdb->prepare( "
						SELECT DISTINCT user_id 
						FROM {$table}
						WHERE post_id = %d
						AND activity_type = 'course'
						AND user_id > 0
					", $course_id ) );
					
					if ( ! empty( $activity_users ) ) {
						$enrolled_user_ids = array_merge( $enrolled_user_ids, $activity_users );
					}
				}
				
				// Remove duplicates and ensure all are valid user IDs
				$enrolled_user_ids = array_unique( array_map( 'intval', $enrolled_user_ids ) );
				$enrolled_user_ids = array_filter( $enrolled_user_ids, function( $id ) {
					return $id > 0;
				} );
				
				$enrolled = count( $enrolled_user_ids );

				if ( $enrolled === 0 ) {
					// Course with no enrollments
					$courses_report[] = array(
						'id' => (string) $course_id,
						'name' => $course_title,
						'url' => get_permalink( $course_id ),
						'enrolled' => 0,
						'notStarted' => 0,
						'inProgress' => 0,
						'completed' => 0,
						'completionRate' => '0%',
						'quizScore' => '0%',
						'avgTime' => '0h 0m',
						'certificatesIssued' => 0,
						'cpdCertificatesIssued' => 0,
					);
					continue;
				}

				// Count completed, in progress, and not started users
				$completed = 0;
				$in_progress = 0;
				$not_started = 0;

				// Batch check for better performance on large user sets
				if ( count( $enrolled_user_ids ) > 100 ) {
					// For large datasets, use SQL queries for better performance
					
					// Get completed users
					$completed_users = $wpdb->get_col( $wpdb->prepare( "
						SELECT DISTINCT user_id 
						FROM {$table}
						WHERE post_id = %d
						AND user_id IN (" . implode( ',', $enrolled_user_ids ) . ")
						AND activity_type = 'course'
						AND activity_status = 1
					", $course_id ) );
					
					$completed = count( $completed_users );
					
					// Get users who started but not completed
					$started_users = $wpdb->get_col( $wpdb->prepare( "
						SELECT DISTINCT user_id 
						FROM {$table}
						WHERE post_id = %d
						AND user_id IN (" . implode( ',', $enrolled_user_ids ) . ")
						AND activity_type = 'course'
						AND activity_started > 0
						AND (activity_status = 0 OR activity_status IS NULL)
					", $course_id ) );
					
					$in_progress = count( $started_users );
					
					// Calculate not started
					$not_started = $enrolled - $completed - $in_progress;
					
				} else {
					// For smaller datasets, check each user individually
					foreach ( $enrolled_user_ids as $user_id ) {
						// Check if course is completed
						$is_completed = false;
						
						// Check via activity table first (fastest)
						$completion_status = $wpdb->get_var( $wpdb->prepare( "
							SELECT activity_status 
							FROM {$table}
							WHERE post_id = %d
							AND user_id = %d
							AND activity_type = 'course'
							ORDER BY activity_id DESC
							LIMIT 1
						", $course_id, $user_id ) );
						
						if ( $completion_status == 1 ) {
							$completed++;
						} else {
							// Check if user has started the course
							$has_started = $wpdb->get_var( $wpdb->prepare( "
								SELECT COUNT(*)
								FROM {$table}
								WHERE post_id = %d
								AND user_id = %d
								AND activity_type = 'course'
								AND activity_started > 0
							", $course_id, $user_id ) );

							if ( $has_started > 0 ) {
								$in_progress++;
							} else {
								$not_started++;
							}
						}
					}
				}

				// Calculate completion rate
				$completion_rate = $enrolled > 0 ? round( ( $completed / $enrolled ) * 100, 1 ) : 0;

				// Get average quiz score for this course
				$quiz_scores = $wpdb->get_col( $wpdb->prepare( "
					SELECT CAST(m.activity_meta_value AS DECIMAL(5,2))
					FROM {$table} a
					INNER JOIN {$wpdb->prefix}learndash_user_activity_meta m ON a.activity_id = m.activity_id
					WHERE a.course_id = %d
					AND a.activity_type = 'quiz'
					AND m.activity_meta_key = 'percentage'
					AND m.activity_meta_value IS NOT NULL
					AND m.activity_meta_value != ''
					AND CAST(m.activity_meta_value AS DECIMAL(5,2)) >= 0
					AND CAST(m.activity_meta_value AS DECIMAL(5,2)) <= 100
				", $course_id ) );

				$avg_quiz_score = 0;
				if ( ! empty( $quiz_scores ) ) {
					$avg_quiz_score = round( array_sum( $quiz_scores ) / count( $quiz_scores ), 1 );
				}

				// Calculate average time spent for completed courses
				$time_data = $wpdb->get_results( $wpdb->prepare( "
					SELECT 
						user_id,
						MIN(activity_started) as started,
						MAX(activity_completed) as completed
					FROM {$table}
					WHERE post_id = %d
					AND activity_type = 'course'
					AND activity_status = 1
					AND activity_started > 0
					AND activity_completed > 0
					GROUP BY user_id
					HAVING completed > started
				", $course_id ), ARRAY_A );

				$total_seconds = 0;
				$time_count = 0;
				
				foreach ( $time_data as $time_row ) {
					$started = intval( $time_row['started'] );
					$completed_time = intval( $time_row['completed'] );
					
					if ( $completed_time > $started ) {
						$time_diff = $completed_time - $started;
						// Filter out unrealistic times (less than 1 minute or more than 365 days)
						if ( $time_diff >= 60 && $time_diff <= 31536000 ) {
							$total_seconds += $time_diff;
							$time_count++;
						}
					}
				}

				$avg_time_str = '0h 0m';
				if ( $time_count > 0 ) {
					$avg_seconds = $total_seconds / $time_count;
					$hours = floor( $avg_seconds / 3600 );
					$minutes = floor( ( $avg_seconds % 3600 ) / 60 );
					$avg_time_str = $hours . 'h ' . $minutes . 'm';
				}

				// Calculate certificates issued for this course
				$certificates_issued = 0;
				$cpd_certificates_issued = 0;
				
				if ( isset( $course_certificate_map[$course_id] ) ) {
					$course_cert_id = $course_certificate_map[$course_id];
					
					// Certificates are issued to completed users
					if ( in_array( $course_cert_id, $cpd_certificate_ids ) ) {
						// This is a CPD certificate
						$cpd_certificates_issued = $completed;
					} else {
						// This is a regular certificate
						$certificates_issued = $completed;
					}
				}

				$courses_report[] = array(
					'id' => (string) $course_id,
					'name' => $course_title,
					'url' => get_permalink( $course_id ),
					'enrolled' => $enrolled,
					'notStarted' => $not_started,
					'inProgress' => $in_progress,
					'completed' => $completed,
					'completionRate' => $completion_rate . '%',
					'quizScore' => $avg_quiz_score . '%',
					'avgTime' => $avg_time_str,
					'certificatesIssued' => $certificates_issued,
					'cpdCertificatesIssued' => $cpd_certificates_issued,
				);
			}

			return new WP_REST_Response( array(
				'success' => true,
				'data' => $courses_report,
				'total' => $total_courses,
				'page' => $page,
				'per_page' => $per_page,
			), 200 );

		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching course report.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Get learner report
	 */
	public function get_learner_report( $request ) {
		global $wpdb;

		try {
			// Validate LearnDash DB table exists
			$table = $wpdb->prefix . 'learndash_user_activity';
			$exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $table ) );
			
			if ( ! $exists ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'LearnDash activity table not found.',
				), 404 );
			}

			// Get query parameters
			$page = max( 1, intval( $request->get_param( 'page' ) ) ?: 1 );
			$per_page = max( 1, min( 100, intval( $request->get_param( 'per_page' ) ) ?: 10 ) );
			$search = sanitize_text_field( $request->get_param( 'search' ) ?: '' );
			$days = intval( $request->get_param( 'days' ) ) ?: 0; // 0 = all time

			// Check if meta table exists (for quiz scores)
			$meta_table = $wpdb->prefix . 'learndash_user_activity_meta';
			$meta_table_exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $meta_table ) );

			// Build optimized query to get distinct users who have course activity
			// This avoids loading all users into memory
			$users_table = $wpdb->users;
			$usermeta_table = $wpdb->usermeta;
			
			// Base query: Get distinct users who have activity in courses
			$search_condition = '';
			$search_params = array();
			
			if ( $search ) {
				$search_term = '%' . $wpdb->esc_like( $search ) . '%';
				$search_condition = " AND (
					u.display_name LIKE %s OR 
					u.user_email LIKE %s OR 
					u.user_login LIKE %s
				)";
				$search_params = array( $search_term, $search_term, $search_term );
			}

			// Get total count of distinct users with course activity
			$count_query = "
				SELECT COUNT(DISTINCT a.user_id) as total
				FROM {$table} a
				INNER JOIN {$users_table} u ON a.user_id = u.ID
				WHERE a.activity_type = 'course'
				AND a.activity_started > 0
				{$search_condition}
			";
			
			if ( $search ) {
				$count_query = $wpdb->prepare( $count_query, $search_params );
			}
			
			$total_learners = (int) $wpdb->get_var( $count_query );

			if ( $total_learners === 0 ) {
				return new WP_REST_Response( array(
					'success' => true,
					'data' => array(),
					'total' => 0,
					'page' => $page,
					'per_page' => $per_page,
				), 200 );
			}

			// Get paginated user IDs with user data in one query
			$offset = ( $page - 1 ) * $per_page;
			$users_query = "
				SELECT DISTINCT 
					a.user_id,
					u.display_name,
					u.user_email,
					u.user_login
				FROM {$table} a
				INNER JOIN {$users_table} u ON a.user_id = u.ID
				WHERE a.activity_type = 'course'
				AND a.activity_started > 0
				{$search_condition}
				ORDER BY u.display_name ASC
				LIMIT %d OFFSET %d
			";
			
			if ( $search ) {
				$users_query = $wpdb->prepare( $users_query, array_merge( $search_params, array( $per_page, $offset ) ) );
			} else {
				$users_query = $wpdb->prepare( $users_query, array( $per_page, $offset ) );
			}
			
			$users = $wpdb->get_results( $users_query, ARRAY_A );

			if ( empty( $users ) ) {
				return new WP_REST_Response( array(
					'success' => true,
					'data' => array(),
					'total' => $total_learners,
					'page' => $page,
					'per_page' => $per_page,
				), 200 );
			}

			// Extract user IDs for batch processing
			$user_ids = array_column( $users, 'user_id' );
			$user_ids_placeholder = implode( ',', array_fill( 0, count( $user_ids ), '%d' ) );

			// Get enrolled courses count per user (using LearnDash enrollment if available, else activity table)
			$enrolled_courses_query = "
				SELECT 
					user_id,
					COUNT(DISTINCT post_id) as enrolled_count
				FROM {$table}
				WHERE user_id IN ({$user_ids_placeholder})
				AND activity_type = 'course'
				AND activity_started > 0
				GROUP BY user_id
			";
			$enrolled_courses = $wpdb->get_results( $wpdb->prepare( $enrolled_courses_query, $user_ids ), ARRAY_A );
			$enrolled_map = array();
			foreach ( $enrolled_courses as $row ) {
				$enrolled_map[$row['user_id']] = (int) $row['enrolled_count'];
			}

			// Get completed courses count per user (optimized batch query)
			$completed_courses_query = "
				SELECT 
					user_id,
					COUNT(DISTINCT post_id) as completed_count
				FROM {$table}
				WHERE user_id IN ({$user_ids_placeholder})
				AND activity_type = 'course'
				AND activity_status = 1
				GROUP BY user_id
			";
			$completed_courses = $wpdb->get_results( $wpdb->prepare( $completed_courses_query, $user_ids ), ARRAY_A );
			$completed_map = array();
			foreach ( $completed_courses as $row ) {
				$completed_map[$row['user_id']] = (int) $row['completed_count'];
			}

			// Get total time spent per user (optimized batch query)
			$time_query = "
				SELECT 
					user_id,
					SUM(
						CASE 
							WHEN activity_completed > activity_started 
							AND activity_completed - activity_started >= 60 
							AND activity_completed - activity_started <= 31536000
							THEN activity_completed - activity_started
							ELSE 0
						END
					) as total_seconds
				FROM {$table}
				WHERE user_id IN ({$user_ids_placeholder})
				AND activity_type = 'course'
				AND activity_started > 0
				AND activity_completed > 0
				GROUP BY user_id
			";
			$time_data = $wpdb->get_results( $wpdb->prepare( $time_query, $user_ids ), ARRAY_A );
			$time_map = array();
			foreach ( $time_data as $row ) {
				$time_map[$row['user_id']] = (int) $row['total_seconds'];
			}

			// Get average quiz scores per user (optimized batch query)
			$quiz_scores_map = array();
			if ( $meta_table_exists ) {
				$quiz_query = "
					SELECT 
						a.user_id,
						AVG(CAST(m.activity_meta_value AS DECIMAL(5,2))) as avg_score,
						COUNT(*) as quiz_count
					FROM {$table} a
					INNER JOIN {$meta_table} m ON a.activity_id = m.activity_id
					WHERE a.user_id IN ({$user_ids_placeholder})
					AND a.activity_type = 'quiz'
					AND m.activity_meta_key = 'percentage'
					AND m.activity_meta_value IS NOT NULL
					AND m.activity_meta_value != ''
					AND CAST(m.activity_meta_value AS DECIMAL(5,2)) >= 0
					AND CAST(m.activity_meta_value AS DECIMAL(5,2)) <= 100
					GROUP BY a.user_id
				";
				$quiz_data = $wpdb->get_results( $wpdb->prepare( $quiz_query, $user_ids ), ARRAY_A );
				foreach ( $quiz_data as $row ) {
					if ( $row['quiz_count'] > 0 ) {
						$quiz_scores_map[$row['user_id']] = round( (float) $row['avg_score'], 1 );
					}
				}
			}

			// Build response array
			$learners_report = array();
			foreach ( $users as $user_data ) {
				$user_id = (int) $user_data['user_id'];
				$courses_enrolled = isset( $enrolled_map[$user_id] ) ? $enrolled_map[$user_id] : 0;
				
				// Skip users with no enrolled courses
				if ( $courses_enrolled === 0 ) {
					continue;
				}

				$courses_completed = isset( $completed_map[$user_id] ) ? $completed_map[$user_id] : 0;
				$total_seconds = isset( $time_map[$user_id] ) ? $time_map[$user_id] : 0;
				$total_hours = floor( $total_seconds / 3600 );
				$average_score = isset( $quiz_scores_map[$user_id] ) ? $quiz_scores_map[$user_id] : 0;

				// Format learner ID
				$learner_id = 'L' . str_pad( $user_id, 3, '0', STR_PAD_LEFT );

				$learners_report[] = array(
					'id' => $learner_id,
					'name' => $user_data['display_name'],
					'email' => $user_data['user_email'],
					'coursesEnrolled' => $courses_enrolled,
					'coursesCompleted' => $courses_completed,
					'totalHours' => $total_hours,
					'averageScore' => $average_score . '%',
				);
			}

			return new WP_REST_Response( array(
				'success' => true,
				'data' => $learners_report,
				'total' => $total_learners,
				'page' => $page,
				'per_page' => $per_page,
			), 200 );

		} catch ( Exception $e ) {
			error_log( 'Learner report error: ' . $e->getMessage() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching learner report.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Get team report
	 */
	public function get_team_report( $request ) {
		global $wpdb;

		try {
			// Get query parameters
			$page = max( 1, intval( $request->get_param( 'page' ) ) ?: 1 );
			$per_page = max( 1, min( 100, intval( $request->get_param( 'per_page' ) ) ?: 100 ) );
			$search = sanitize_text_field( $request->get_param( 'search' ) ?: '' );

			// Get all published teams (groups)
			$args = array(
				'post_type' => 'groups',
				'post_status' => 'publish',
				'posts_per_page' => $per_page,
				'paged' => $page,
				'orderby' => 'title',
				'order' => 'ASC',
			);

			if ( $search ) {
				$args['s'] = $search;
			}

			$query = new WP_Query( $args );
			$teams_report = array();

			foreach ( $query->posts as $group ) {
				$group_id = $group->ID;
				$group_name = $group->post_title;
				
				// Skip if search doesn't match
				if ( $search && stripos( $group_name, $search ) === false ) {
					continue;
				}

				// Generate initials from team name
				$initials = '';
				$words = explode( ' ', $group_name );
				if ( count( $words ) >= 2 ) {
					$initials = strtoupper( substr( $words[0], 0, 1 ) . substr( $words[1], 0, 1 ) );
				} else {
					$initials = strtoupper( substr( $group_name, 0, 2 ) );
				}

				// Get group members
				$group_users = array();
				if ( function_exists( 'learndash_get_groups_user_ids' ) ) {
					$group_users = learndash_get_groups_user_ids( $group_id );
					if ( ! is_array( $group_users ) ) {
						$group_users = array();
					}
				}
				
				$members = count( $group_users );

				if ( $members === 0 ) {
					// Team with no members
					$teams_report[] = array(
						'id' => $group_id,
						'name' => $group_name,
						'initials' => $initials,
						'members' => 0,
						'avgProgress' => 0,
						'completionRate' => 0,
					);
					continue;
				}

				// Get courses associated with this team - use multiple fallback methods (same as get_teams_list)
				$group_courses = array();
				
				// Method 1: Use LearnDash function (most common)
				if ( function_exists( 'learndash_get_group_courses' ) ) {
					$group_courses = learndash_get_group_courses( $group_id );
					// Ensure it's an array
					if ( ! is_array( $group_courses ) ) {
						$group_courses = array();
					}
				}
				
				// Method 2: Try alternative LearnDash function
				if ( empty( $group_courses ) && function_exists( 'learndash_group_enrolled_courses' ) ) {
					$group_courses = learndash_group_enrolled_courses( $group_id );
					if ( ! is_array( $group_courses ) ) {
						$group_courses = array();
					}
				}
				
				// Method 3: Get from post meta (LearnDash stores courses here)
				if ( empty( $group_courses ) ) {
					$course_ids = get_post_meta( $group_id, 'learndash_group_enrolled_courses', true );
					if ( is_array( $course_ids ) && ! empty( $course_ids ) ) {
						$group_courses = $course_ids;
					} elseif ( is_numeric( $course_ids ) && $course_ids > 0 ) {
						// Sometimes it's stored as a single ID
						$group_courses = array( $course_ids );
					}
				}
				
				// Method 4: Check for individual course meta keys (from create_team fallback)
				if ( empty( $group_courses ) ) {
					$meta_keys = $wpdb->get_col( $wpdb->prepare(
						"SELECT meta_key FROM {$wpdb->postmeta} 
						 WHERE post_id = %d 
						 AND meta_key LIKE 'learndash_group_enrolled_%%'",
						$group_id
					) );
					
					foreach ( $meta_keys as $meta_key ) {
						$course_id = str_replace( 'learndash_group_enrolled_', '', $meta_key );
						if ( is_numeric( $course_id ) && $course_id > 0 ) {
							$group_courses[] = intval( $course_id );
						}
					}
				}
				
				// Method 5: Try other common meta keys
				if ( empty( $group_courses ) ) {
					$meta_keys = array(
						'learndash_group_courses',
						'ld_group_courses',
						'group_courses',
						'_ld_group_courses',
					);
					foreach ( $meta_keys as $meta_key ) {
						$course_ids = get_post_meta( $group_id, $meta_key, true );
						if ( is_array( $course_ids ) && ! empty( $course_ids ) ) {
							$group_courses = $course_ids;
							break;
						} elseif ( is_numeric( $course_ids ) && $course_ids > 0 ) {
							$group_courses = array( $course_ids );
							break;
						}
					}
				}

				// Ensure all course IDs are integers
				if ( ! empty( $group_courses ) ) {
					$group_courses = array_map( 'intval', $group_courses );
					$group_courses = array_filter( $group_courses ); // Remove zeros
					$group_courses = array_unique( $group_courses ); // Remove duplicates
				}

				// Calculate average progress and completion rate
				$avg_progress = 0;
				$completion_rate = 0;

				if ( ! empty( $group_courses ) ) {
					$total_progress_sum = 0;
					$members_with_progress = 0;
					$completed_members = 0;

					foreach ( $group_users as $user_id ) {
						$user_completed_any = false;
						$user_progress_sum = 0;
						$user_courses_count = 0;

						// Check completion and progress for each team course
						foreach ( $group_courses as $course_id ) {
							// Verify course exists and is published
							$course = get_post( $course_id );
							if ( ! $course || $course->post_status !== 'publish' ) {
								continue;
							}

							// Check if user is enrolled in this course
							$user_enrolled = false;
							if ( function_exists( 'learndash_user_get_enrolled_courses' ) ) {
								$user_courses = learndash_user_get_enrolled_courses( $user_id, array(), true );
								$user_enrolled = is_array( $user_courses ) && in_array( $course_id, $user_courses );
							}

							// Only check progress if user is enrolled
							if ( $user_enrolled ) {
								// Check completion first (most reliable)
								if ( function_exists( 'learndash_course_completed' ) ) {
									$is_completed = learndash_course_completed( $user_id, $course_id );
									if ( $is_completed ) {
										$user_completed_any = true;
										$user_progress_sum += 100; // Completed = 100%
										$user_courses_count++;
									} else {
										// Get progress percentage if not completed
										if ( function_exists( 'learndash_course_progress' ) ) {
											$progress_data = learndash_course_progress( array(
												'user_id' => $user_id,
												'course_id' => $course_id,
												'array' => true
											) );
											
											if ( isset( $progress_data['percentage'] ) && is_numeric( $progress_data['percentage'] ) ) {
												$user_progress_sum += floatval( $progress_data['percentage'] );
												$user_courses_count++;
											}
										}
									}
								} else {
									// Fallback: Use progress only
									if ( function_exists( 'learndash_course_progress' ) ) {
										$progress_data = learndash_course_progress( array(
											'user_id' => $user_id,
											'course_id' => $course_id,
											'array' => true
										) );
										
										if ( isset( $progress_data['percentage'] ) && is_numeric( $progress_data['percentage'] ) ) {
											$progress_percentage = floatval( $progress_data['percentage'] );
											$user_progress_sum += $progress_percentage;
											$user_courses_count++;
											
											// Consider 100% as completed
											if ( $progress_percentage >= 100 ) {
												$user_completed_any = true;
											}
										}
									}
								}
							}
						}

						if ( $user_completed_any ) {
							$completed_members++;
						}

						// Calculate average progress for this user across team courses
						if ( $user_courses_count > 0 ) {
							$total_progress_sum += ( $user_progress_sum / $user_courses_count );
							$members_with_progress++;
						}
					}

					// Calculate average progress
					if ( $members_with_progress > 0 ) {
						$avg_progress = round( $total_progress_sum / $members_with_progress );
					}

					// Calculate completion rate (percentage of members who completed at least one course)
					if ( $members > 0 ) {
						$completion_rate = round( ( $completed_members / $members ) * 100 );
					}
				} else {
					// If no group courses found, calculate based on all courses that team members are enrolled in
					$all_team_courses = array();
					foreach ( $group_users as $user_id ) {
						if ( function_exists( 'learndash_user_get_enrolled_courses' ) ) {
							$user_courses = learndash_user_get_enrolled_courses( $user_id, array(), true );
							if ( is_array( $user_courses ) ) {
								$all_team_courses = array_merge( $all_team_courses, $user_courses );
							}
						}
					}
					$all_team_courses = array_unique( array_filter( $all_team_courses ) );

					if ( ! empty( $all_team_courses ) ) {
						$total_progress_sum = 0;
						$members_with_progress = 0;
						$completed_members = 0;

						foreach ( $group_users as $user_id ) {
							$user_completed_any = false;
							$user_progress_sum = 0;
							$user_courses_count = 0;

							foreach ( $all_team_courses as $course_id ) {
								$course = get_post( $course_id );
								if ( ! $course || $course->post_status !== 'publish' ) {
									continue;
								}

								if ( function_exists( 'learndash_course_completed' ) ) {
									$is_completed = learndash_course_completed( $user_id, $course_id );
									if ( $is_completed ) {
										$user_completed_any = true;
										$user_progress_sum += 100;
										$user_courses_count++;
									} else {
										if ( function_exists( 'learndash_course_progress' ) ) {
											$progress_data = learndash_course_progress( array(
												'user_id' => $user_id,
												'course_id' => $course_id,
												'array' => true
											) );
											
											if ( isset( $progress_data['percentage'] ) && is_numeric( $progress_data['percentage'] ) ) {
												$user_progress_sum += floatval( $progress_data['percentage'] );
												$user_courses_count++;
											}
										}
									}
								}
							}

							if ( $user_completed_any ) {
								$completed_members++;
							}

							if ( $user_courses_count > 0 ) {
								$total_progress_sum += ( $user_progress_sum / $user_courses_count );
								$members_with_progress++;
							}
						}

						if ( $members_with_progress > 0 ) {
							$avg_progress = round( $total_progress_sum / $members_with_progress );
						}

						if ( $members > 0 ) {
							$completion_rate = round( ( $completed_members / $members ) * 100 );
						}
					}
				}

				$teams_report[] = array(
					'id' => $group_id,
					'name' => $group_name,
					'initials' => $initials,
					'members' => $members,
					'avgProgress' => $avg_progress,
					'completionRate' => $completion_rate,
				);
			}

			// Get total count for pagination
			$total_args = array(
				'post_type' => 'groups',
				'post_status' => 'publish',
				'posts_per_page' => -1,
				'fields' => 'ids',
			);

			if ( $search ) {
				$total_args['s'] = $search;
			}

			$total_query = new WP_Query( $total_args );
			$total_teams = $total_query->found_posts;

			return new WP_REST_Response( array(
				'success' => true,
				'data' => $teams_report,
				'total' => $total_teams,
				'page' => $page,
				'per_page' => $per_page,
			), 200 );

		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching team report.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Get course popularity
	 */
	public function get_course_popularity( $request ) {
		global $wpdb;

		try {
			// Check if LearnDash activity table exists
			$table = $wpdb->prefix . 'learndash_user_activity';
			$table_exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $table ) );
			
			if ( ! $table_exists ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'LearnDash activity table not found.',
				), 500 );
			}

			// Get total published courses count (single query)
			$total_courses = (int) $wpdb->get_var( "
				SELECT COUNT(ID)
				FROM {$wpdb->posts}
				WHERE post_type = 'sfwd-courses'
				AND post_status = 'publish'
			" );

			// Get course enrollment and completion stats using SQL aggregation
			// Using activity table which is the most efficient source for large datasets
			$course_stats_query = "
				SELECT 
					p.ID as course_id,
					p.post_title as course_name,
					COUNT(DISTINCT a.user_id) as enrolled_count,
					SUM(CASE WHEN a.activity_status = 1 THEN 1 ELSE 0 END) as completed_count
				FROM {$wpdb->posts} p
				LEFT JOIN {$table} a ON p.ID = a.post_id AND a.activity_type = 'course' AND a.user_id > 0
				WHERE p.post_type = 'sfwd-courses'
				AND p.post_status = 'publish'
				GROUP BY p.ID, p.post_title
				ORDER BY enrolled_count DESC
			";

			$course_stats = $wpdb->get_results( $course_stats_query, ARRAY_A );

			// Initialize metrics
			$total_enrollments = 0;
			$total_completion_sum = 0;
			$courses_with_completion = 0;
			$top_courses_data = array();
			$category_stats = array();

			// Get course IDs for batch category lookup
			$course_ids = array_column( $course_stats, 'course_id' );
			
			// Batch get all course categories in one query
			$category_terms = array();
			if ( ! empty( $course_ids ) ) {
				$placeholders = implode( ',', array_fill( 0, count( $course_ids ), '%d' ) );
				$category_query = $wpdb->prepare( "
					SELECT tr.object_id as course_id, t.name as category_name
					FROM {$wpdb->term_relationships} tr
					INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
					INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
					WHERE tr.object_id IN ($placeholders)
					AND tt.taxonomy = 'ld_course_category'
				", $course_ids );
				
				$category_results = $wpdb->get_results( $category_query, ARRAY_A );
				foreach ( $category_results as $cat ) {
					if ( ! isset( $category_terms[$cat['course_id']] ) ) {
						$category_terms[$cat['course_id']] = array();
					}
					$category_terms[$cat['course_id']][] = $cat['category_name'];
				}
			}

			// Process course stats
			foreach ( $course_stats as $stat ) {
				$course_id = (int) $stat['course_id'];
				$course_name = $stat['course_name'];
				$enrolled_count = (int) $stat['enrolled_count'];
				$completed_count = (int) $stat['completed_count'];

				// Get categories for this course
				$categories = isset( $category_terms[$course_id] ) && ! empty( $category_terms[$course_id] ) 
					? $category_terms[$course_id] 
					: array( 'Uncategorized' );

				$total_enrollments += $enrolled_count;

				// Calculate completion rate for this course
				$course_completion_rate = 0;
				if ( $enrolled_count > 0 ) {
					$course_completion_rate = ( $completed_count / $enrolled_count ) * 100;
					$total_completion_sum += $course_completion_rate;
					$courses_with_completion++;
				}

				// Add to top courses (we'll sort later, but query already sorted by enrolled_count DESC)
				$top_courses_data[] = array(
					'id' => (string) $course_id,
					'name' => $course_name,
					'url' => get_permalink( $course_id ),
					'enrolled' => $enrolled_count,
					'completed' => $completed_count,
					'completionRate' => round( $course_completion_rate, 1 ),
					'rating' => 0, // LearnDash doesn't have built-in ratings, default to 0
				);

				// Update category stats
				foreach ( $categories as $category_name ) {
					if ( ! isset( $category_stats[$category_name] ) ) {
						$category_stats[$category_name] = array(
							'name' => $category_name,
							'courses' => 0,
							'enrollments' => 0,
							'completionSum' => 0,
							'coursesWithCompletion' => 0,
						);
					}
					$category_stats[$category_name]['courses']++;
					$category_stats[$category_name]['enrollments'] += $enrolled_count;
					if ( $enrolled_count > 0 ) {
						$category_stats[$category_name]['completionSum'] += $course_completion_rate;
						$category_stats[$category_name]['coursesWithCompletion']++;
					}
				}
			}

			// Calculate average completion rate
			$avg_completion_rate = 0;
			if ( $courses_with_completion > 0 ) {
				$avg_completion_rate = round( $total_completion_sum / $courses_with_completion, 1 );
			}

			// Get top 10 courses (already sorted by enrollment from SQL query)
			$top_courses = array_slice( $top_courses_data, 0, 10 );
			foreach ( $top_courses as $index => &$course ) {
				$course['rank'] = $index + 1;
			}

			// Process category stats
			$category_list = array();
			$category_colors = array(
				'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-pink-500',
				'bg-orange-500', 'bg-purple-500', 'bg-cyan-500', 'bg-red-400',
				'bg-indigo-500', 'bg-teal-500'
			);
			$color_index = 0;

			foreach ( $category_stats as $category ) {
				$avg_completion = 0;
				if ( $category['coursesWithCompletion'] > 0 ) {
					$avg_completion = round( $category['completionSum'] / $category['coursesWithCompletion'], 1 );
				}

				$category_list[] = array(
					'name' => $category['name'],
					'color' => $category_colors[$color_index % count( $category_colors )],
					'courses' => $category['courses'],
					'enrollments' => $category['enrollments'],
					'avgCompletion' => $avg_completion,
				);
				$color_index++;
			}

			// Sort categories by enrollments (descending)
			usort( $category_list, function( $a, $b ) {
				return $b['enrollments'] - $a['enrollments'];
			} );

			// Build response
			return new WP_REST_Response( array(
				'success' => true,
				'data' => array(
					'metrics' => array(
						'totalCourses' => $total_courses,
						'totalEnrollments' => $total_enrollments,
						'avgCompletionRate' => $avg_completion_rate,
						'avgRating' => 0, // LearnDash doesn't have built-in ratings
					),
					'topCourses' => $top_courses,
					'categories' => $category_list,
				),
			), 200 );

		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching course popularity report.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	// ============================================
	// SETTINGS ENDPOINTS
	// ============================================
	
	/**
	 * Get general settings
	 */
	public function get_general_settings( $request ) {
		try {
			// Authenticate user from JWT token or WordPress session and set as current user
			$current_user_id = authenticate_and_set_current_user();
			if ( ! $current_user_id || $current_user_id === 0 ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}
			
			// Security: Verify user is administrator
			if ( ! current_user_can( 'administrator' ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Insufficient permissions. Administrator access required.',
				), 403 );
			}
			
			$current_user = get_userdata( $current_user_id );
			if ( ! $current_user ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not found.',
				), 404 );
			}
			
			// Get the currently logged-in admin's email
			$current_admin_email = $current_user->user_email;
			
			// Get timezone
			$custom_timezone = get_option( 'akf_timezone', false );
			$wp_timezone = get_option( 'timezone_string', false );
			
			if ( $custom_timezone !== false && ! empty( $custom_timezone ) && trim( $custom_timezone ) !== '' ) {
				$timezone = $custom_timezone;
			} else {
				if ( $wp_timezone !== false && ! empty( $wp_timezone ) && trim( $wp_timezone ) !== '' ) {
					$timezone = $wp_timezone;
				} else {
					$gmt_offset = get_option( 'gmt_offset', 0 );
					if ( $gmt_offset != 0 ) {
						$timezone = 'UTC' . ( $gmt_offset >= 0 ? '+' : '' ) . number_format( $gmt_offset, 1 );
					} else {
						$timezone = 'UTC';
					}
				}
			}
			
			// Get date format
			$custom_date_format = get_option( 'akf_date_format', false );
			$wp_date_format = get_option( 'date_format', 'm/d/Y' );
			
			if ( $custom_date_format !== false && ! empty( $custom_date_format ) && trim( $custom_date_format ) !== '' ) {
				$date_format = $custom_date_format;
			} else {
				$date_format = ! empty( $wp_date_format ) && trim( $wp_date_format ) !== '' ? $wp_date_format : 'm/d/Y';
			}
			
			// Get language
			$custom_language = get_option( 'akf_default_language', false );
			$wp_language = get_option( 'WPLANG', '' );
			
			if ( $custom_language !== false && ! empty( $custom_language ) && trim( $custom_language ) !== '' ) {
				$language = $custom_language;
			} else {
				$language = ! empty( $wp_language ) && trim( $wp_language ) !== '' ? $wp_language : 'en';
			}
			
			$settings = array(
				'organisationName' => get_option( 'akf_organisation_name', 'Aga Khan Foundation' ),
				'adminEmail' => $current_admin_email,
				'timezone' => $timezone,
				'dateFormat' => $date_format,
				'language' => $language,
				'profilePicture' => get_user_meta( $current_user_id, 'akf_profile_picture', true ) ?: null,
			);
			
			return new WP_REST_Response( array(
				'success' => true,
				'data' => $settings,
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching general settings.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Update general settings
	 */
	public function update_general_settings( $request ) {
		try {
			// Authenticate user from JWT token or WordPress session and set as current user
			$current_user_id = authenticate_and_set_current_user();
			if ( ! $current_user_id || $current_user_id === 0 ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}
			
			// Security: Verify user is administrator
			if ( ! current_user_can( 'administrator' ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Insufficient permissions. Administrator access required.',
				), 403 );
			}
			
			$current_user = get_userdata( $current_user_id );
			if ( ! $current_user ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not found.',
				), 404 );
			}
			
			$params = $request->get_json_params();
			$updated_fields = array();
			
			// Security: Reject any attempt to pass user ID in request
			if ( isset( $params['userId'] ) || isset( $params['user_id'] ) || isset( $params['ID'] ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Cannot modify user ID. You can only update your own settings.',
				), 403 );
			}
			
			// Update Organisation Name
			if ( isset( $params['organisationName'] ) ) {
				$org_name = sanitize_text_field( $params['organisationName'] );
				update_option( 'akf_organisation_name', $org_name );
				$updated_fields[] = 'organisationName';
			}
			
			// Update Administrator Email (update the currently logged-in user's email)
			if ( isset( $params['adminEmail'] ) ) {
				$admin_email = sanitize_email( $params['adminEmail'] );
				if ( ! is_email( $admin_email ) ) {
					return new WP_REST_Response( array(
						'success' => false,
						'message' => 'Invalid email address.',
					), 400 );
				}
				
				// Check if email is already in use by another user
				$email_exists = email_exists( $admin_email );
				if ( $email_exists && $email_exists != $current_user_id ) {
					return new WP_REST_Response( array(
						'success' => false,
						'message' => 'This email is already registered to another user.',
					), 400 );
				}
				
				// Update the current user's email
				$user_data = array(
					'ID' => $current_user_id,
					'user_email' => $admin_email,
				);
				$result = wp_update_user( $user_data );
				
				if ( is_wp_error( $result ) ) {
					return new WP_REST_Response( array(
						'success' => false,
						'message' => 'Failed to update email: ' . $result->get_error_message(),
					), 500 );
				}
				
				$updated_fields[] = 'adminEmail';
			}
			
			// Update Timezone (only if explicitly provided and not empty)
			if ( isset( $params['timezone'] ) && $params['timezone'] !== null && $params['timezone'] !== '' ) {
				$timezone = sanitize_text_field( $params['timezone'] );
				update_option( 'akf_timezone', $timezone );
				// Also update WordPress site timezone (for entire website)
				update_option( 'timezone_string', $timezone );
				$updated_fields[] = 'timezone';
			}
			
			// Update Date Format (only if explicitly provided and not empty)
			if ( isset( $params['dateFormat'] ) && $params['dateFormat'] !== null && $params['dateFormat'] !== '' ) {
				$date_format = sanitize_text_field( $params['dateFormat'] );
				update_option( 'akf_date_format', $date_format );
				// Map to WordPress date format and update WordPress site default
				$wp_date_format = $date_format;
				if ( $date_format === 'us' ) {
					$wp_date_format = 'm/d/Y';
				} elseif ( $date_format === 'eu' ) {
					$wp_date_format = 'd/m/Y';
				} elseif ( $date_format === 'iso' ) {
					$wp_date_format = 'Y-m-d';
				} elseif ( $date_format === 'long' ) {
					$wp_date_format = 'F j, Y';
				}
				update_option( 'date_format', $wp_date_format );
				$updated_fields[] = 'dateFormat';
			}
			
			// Update Default Language (only if explicitly provided and not empty)
			if ( isset( $params['language'] ) && $params['language'] !== null && $params['language'] !== '' ) {
				$language = sanitize_text_field( $params['language'] );
				update_option( 'akf_default_language', $language );
				// Map to WordPress language code and update WordPress site default
				$wp_lang = 'en';
				$lang_map = array(
					'english' => 'en',
					'spanish' => 'es',
					'french' => 'fr',
					'german' => 'de',
					'chinese' => 'zh_CN',
					'arabic' => 'ar',
				);
				if ( isset( $lang_map[ $language ] ) ) {
					$wp_lang = $lang_map[ $language ];
				}
				update_option( 'WPLANG', $wp_lang );
				$updated_fields[] = 'language';
			}
			
			// Update Profile Picture
			if ( isset( $params['profilePicture'] ) ) {
				if ( $params['profilePicture'] === null || $params['profilePicture'] === '' ) {
					delete_user_meta( $current_user_id, 'akf_profile_picture' );
				} else {
					// If it's a base64 image, handle upload
					if ( strpos( $params['profilePicture'], 'data:image' ) === 0 ) {
						$image_data = $params['profilePicture'];
						
						// Ensure the Image_Upload class is loaded
						if ( ! class_exists( 'AKF_Image_Upload' ) ) {
							return new WP_REST_Response( array(
								'success' => false,
								'message' => 'Image upload handler not available.',
							), 500 );
						}
						
						$upload_result = AKF_Image_Upload::handle_base64_image_upload( $image_data, $current_user_id );
						if ( $upload_result['success'] ) {
							update_user_meta( $current_user_id, 'akf_profile_picture', $upload_result['url'] );
							$updated_fields[] = 'profilePicture';
						} else {
							return new WP_REST_Response( array(
								'success' => false,
								'message' => $upload_result['message'],
							), 400 );
						}
					} else {
						// It's already a URL
						update_user_meta( $current_user_id, 'akf_profile_picture', esc_url_raw( $params['profilePicture'] ) );
						$updated_fields[] = 'profilePicture';
					}
				}
			}
			
			// Get updated settings (only for current user)
			$updated_user = get_userdata( $current_user_id );
			if ( ! $updated_user ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Failed to retrieve updated user data.',
				), 500 );
			}
			
			// Get timezone
			$custom_timezone = get_option( 'akf_timezone', false );
			$wp_timezone = get_option( 'timezone_string', false );
			
			if ( $custom_timezone !== false && ! empty( $custom_timezone ) && trim( $custom_timezone ) !== '' ) {
				$timezone = $custom_timezone;
			} else {
				if ( $wp_timezone !== false && ! empty( $wp_timezone ) && trim( $wp_timezone ) !== '' ) {
					$timezone = $wp_timezone;
				} else {
					$gmt_offset = get_option( 'gmt_offset', 0 );
					if ( $gmt_offset != 0 ) {
						$timezone = 'UTC' . ( $gmt_offset >= 0 ? '+' : '' ) . number_format( $gmt_offset, 1 );
					} else {
						$timezone = 'UTC';
					}
				}
			}
			
			// Get date format
			$custom_date_format = get_option( 'akf_date_format', false );
			$wp_date_format = get_option( 'date_format', 'm/d/Y' );
			
			if ( $custom_date_format !== false && ! empty( $custom_date_format ) && trim( $custom_date_format ) !== '' ) {
				$date_format = $custom_date_format;
			} else {
				$date_format = ! empty( $wp_date_format ) && trim( $wp_date_format ) !== '' ? $wp_date_format : 'm/d/Y';
			}
			
			// Get language
			$custom_language = get_option( 'akf_default_language', false );
			$wp_language = get_option( 'WPLANG', '' );
			
			if ( $custom_language !== false && ! empty( $custom_language ) && trim( $custom_language ) !== '' ) {
				$language = $custom_language;
			} else {
				$language = ! empty( $wp_language ) && trim( $wp_language ) !== '' ? $wp_language : 'en';
			}
			
			$updated_settings = array(
				'organisationName' => get_option( 'akf_organisation_name', 'Aga Khan Foundation' ),
				'adminEmail' => $updated_user->user_email,
				'timezone' => $timezone,
				'dateFormat' => $date_format,
				'language' => $language,
				'profilePicture' => get_user_meta( $current_user_id, 'akf_profile_picture', true ) ?: null,
			);
			
			return new WP_REST_Response( array(
				'success' => true,
				'message' => 'General settings updated successfully.',
				'data' => $updated_settings,
				'updated_fields' => $updated_fields,
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while updating general settings.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Get course settings
	 */
	public function get_course_settings( $request ) {
		try {
			$settings = array(
				'certificateGeneration' => get_option( 'akf_certificate_generation', true ),
				'cpdCertificateGeneration' => get_option( 'akf_cpd_certificate_generation', true ),
				'quizRetakes' => get_option( 'akf_quiz_retakes', '3' ),
				'passingScore' => get_option( 'akf_passing_score', '70' ),
				'courseExpiry' => get_option( 'akf_course_expiry', '365' ),
			);
			
			return new WP_REST_Response( array(
				'success' => true,
				'data' => $settings,
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching course settings.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Update course settings
	 */
	public function update_course_settings( $request ) {
		try {
			// Authenticate user from JWT token or WordPress session and set as current user
			$current_user_id = authenticate_and_set_current_user();
			if ( ! $current_user_id || $current_user_id === 0 ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}
			
			// Security: Verify user is administrator
			if ( ! current_user_can( 'administrator' ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Insufficient permissions. Administrator access required.',
				), 403 );
			}
			
			$params = $request->get_json_params();
			$updated_fields = array();
			
			// Security: Reject any attempt to pass user ID in request
			if ( isset( $params['userId'] ) || isset( $params['user_id'] ) || isset( $params['ID'] ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Cannot modify user ID. You can only update settings.',
				), 403 );
			}
			
			// Update Certificate Generation
			if ( isset( $params['certificateGeneration'] ) ) {
				$value = (bool) $params['certificateGeneration'];
				update_option( 'akf_certificate_generation', $value );
				$updated_fields[] = 'certificateGeneration';
			}
			
			// Update CPD Certificate Generation
			if ( isset( $params['cpdCertificateGeneration'] ) ) {
				$value = (bool) $params['cpdCertificateGeneration'];
				update_option( 'akf_cpd_certificate_generation', $value );
				$updated_fields[] = 'cpdCertificateGeneration';
			}
			
			// Update Quiz Retakes
			if ( isset( $params['quizRetakes'] ) ) {
				$value = max( 0, intval( $params['quizRetakes'] ) );
				update_option( 'akf_quiz_retakes', $value );
				$updated_fields[] = 'quizRetakes';
			}
			
			// Update Passing Score
			if ( isset( $params['passingScore'] ) ) {
				$value = max( 0, min( 100, intval( $params['passingScore'] ) ) );
				update_option( 'akf_passing_score', $value );
				$updated_fields[] = 'passingScore';
			}
			
			// Update Course Expiry
			if ( isset( $params['courseExpiry'] ) ) {
				$value = max( 0, intval( $params['courseExpiry'] ) );
				update_option( 'akf_course_expiry', $value );
				$updated_fields[] = 'courseExpiry';
			}
			
			// Get updated settings
			$updated_settings = array(
				'certificateGeneration' => get_option( 'akf_certificate_generation', true ),
				'cpdCertificateGeneration' => get_option( 'akf_cpd_certificate_generation', true ),
				'quizRetakes' => get_option( 'akf_quiz_retakes', '3' ),
				'passingScore' => get_option( 'akf_passing_score', '70' ),
				'courseExpiry' => get_option( 'akf_course_expiry', '365' ),
			);
			
			return new WP_REST_Response( array(
				'success' => true,
				'message' => 'Course settings updated successfully.',
				'data' => $updated_settings,
				'updated_fields' => $updated_fields,
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while updating course settings.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	// ============================================
	// SESSION ENDPOINTS
	// ============================================
	
	/**
	 * Get login sessions
	 */
	public function get_login_sessions( $request ) {
		try {
			// Authenticate user from JWT token or WordPress session and set as current user
			$current_user_id = authenticate_and_set_current_user();
			if ( ! $current_user_id || $current_user_id === 0 ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}
			
			$sessions = get_user_meta( $current_user_id, 'akf_login_sessions', true );
			
			if ( ! is_array( $sessions ) ) {
				$sessions = array();
			}
			
			// Get current session token
			$current_token = wp_get_session_token();
			
			// Format sessions for response
			$formatted_sessions = array();
			foreach ( $sessions as $session_id => $session_data ) {
				$is_current = ( $session_data['token'] === $current_token );
				
				$formatted_sessions[] = array(
					'id' => $session_id,
					'device' => isset( $session_data['device'] ) ? $session_data['device'] : 'Unknown Device',
					'deviceType' => isset( $session_data['deviceType'] ) ? $session_data['deviceType'] : 'desktop',
					'ipAddress' => isset( $session_data['ipAddress'] ) ? $session_data['ipAddress'] : 'Unknown',
					'isCurrent' => $is_current,
					'lastActive' => isset( $session_data['lastActive'] ) ? $session_data['lastActive'] : 'Unknown',
				);
			}
			
			// Sort: current session first, then by last active
			usort( $formatted_sessions, function( $a, $b ) {
				if ( $a['isCurrent'] ) {
					return -1;
				}
				if ( $b['isCurrent'] ) {
					return 1;
				}
				return strtotime( $b['lastActive'] ) - strtotime( $a['lastActive'] );
			} );
			
			return new WP_REST_Response( array(
				'success' => true,
				'data' => $formatted_sessions,
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching login sessions.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Delete login session
	 */
	public function delete_login_session( $request ) {
		try {
			// Authenticate user from JWT token or WordPress session and set as current user
			$current_user_id = authenticate_and_set_current_user();
			if ( ! $current_user_id || $current_user_id === 0 ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}
			
			$session_id = $request->get_param( 'id' );
			
			if ( empty( $session_id ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Session ID is required.',
				), 400 );
			}
			
			$sessions = get_user_meta( $current_user_id, 'akf_login_sessions', true );
			
			if ( ! is_array( $sessions ) ) {
				$sessions = array();
			}
			
			if ( ! isset( $sessions[ $session_id ] ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Session not found.',
				), 404 );
			}
			
			// Don't allow deleting current session
			$current_token = wp_get_session_token();
			if ( isset( $sessions[ $session_id ]['token'] ) && $sessions[ $session_id ]['token'] === $current_token ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Cannot delete current session.',
				), 400 );
			}
			
			// Store token before deleting session
			$session_token = isset( $sessions[ $session_id ]['token'] ) ? $sessions[ $session_id ]['token'] : '';
			
			// Delete the session
			unset( $sessions[ $session_id ] );
			update_user_meta( $current_user_id, 'akf_login_sessions', $sessions );
			
			// Invalidate the session token in WordPress (only if token exists)
			if ( ! empty( $session_token ) ) {
				$session_manager = WP_Session_Tokens::get_instance( $current_user_id );
				$session_manager->destroy( $session_token );
			}
			
			return new WP_REST_Response( array(
				'success' => true,
				'message' => 'Session logged out successfully.',
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while deleting session.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Logout all sessions
	 */
	public function logout_all_sessions( $request ) {
		try {
			// Authenticate user from JWT token or WordPress session and set as current user
			$current_user_id = authenticate_and_set_current_user();
			if ( ! $current_user_id || $current_user_id === 0 ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}
			
			$current_token = wp_get_session_token();
			
			$sessions = get_user_meta( $current_user_id, 'akf_login_sessions', true );
			
			if ( ! is_array( $sessions ) ) {
				$sessions = array();
			}
			
			// Keep only current session
			$current_session = null;
			foreach ( $sessions as $session_id => $session_data ) {
				if ( $session_data['token'] === $current_token ) {
					$current_session = array( $session_id => $session_data );
					break;
				}
			}
			
			// Destroy all other sessions
			$session_manager = WP_Session_Tokens::get_instance( $current_user_id );
			foreach ( $sessions as $session_id => $session_data ) {
				if ( $session_data['token'] !== $current_token ) {
					$session_manager->destroy( $session_data['token'] );
				}
			}
			
			// Update user meta to keep only current session
			update_user_meta( $current_user_id, 'akf_login_sessions', $current_session ?: array() );
			
			return new WP_REST_Response( array(
				'success' => true,
				'message' => 'All other sessions have been logged out.',
			), 200 );
			
		} catch ( Exception $e ) {
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while logging out sessions.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
	
	/**
	 * Get certificate sales report with monthly data
	 * Tracks certificates issued from course completions
	 */
	public function get_certificate_sales_report( $request ) {
		global $wpdb;

		try {
			// Validate LearnDash activity table exists
			$activity_table = $wpdb->prefix . 'learndash_user_activity';
			$exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $activity_table ) );
			
			if ( ! $exists ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'LearnDash activity table not found.',
				), 404 );
			}

			// Determine certificate post type
			$certificate_post_type = 'sfwd-certificates';
			$post_type_exists = $wpdb->get_var( $wpdb->prepare( "
				SELECT COUNT(*) 
				FROM {$wpdb->posts} 
				WHERE post_type = %s 
				LIMIT 1
			", $certificate_post_type ) );
			
			if ( ! $post_type_exists ) {
				$certificate_post_type = 'certificates';
			}

			// Get query parameters
			$months_back = intval( $request->get_param( 'months_back' ) ) ?: 12;

			// Get all certificates and identify CPD certificates
			$all_certificates = $wpdb->get_results( $wpdb->prepare( "
				SELECT ID, post_title
				FROM {$wpdb->posts}
				WHERE post_type = %s
				AND post_status = 'publish'
			", $certificate_post_type ) );

			$cpd_certificate_ids = array();
			$other_certificate_ids = array();

			foreach ( $all_certificates as $cert ) {
				$cert_id = intval( $cert->ID );
				$title = strtolower( $cert->post_title );
				
				// Check if CPD certificate (by title or meta)
				$is_cpd = false;
				if ( strpos( $title, 'cpd' ) !== false ) {
					$is_cpd = true;
				} else {
					$cpd_meta = get_post_meta( $cert_id, 'is_cpd_certificate', true );
					if ( $cpd_meta === '1' || $cpd_meta === 'yes' || $cpd_meta === true || $cpd_meta === 1 ) {
						$is_cpd = true;
					}
				}
				
				if ( $is_cpd ) {
					$cpd_certificate_ids[] = $cert_id;
				} else {
					$other_certificate_ids[] = $cert_id;
				}
			}

			// Get course-to-certificate mappings
			$course_certificate_map = array();
			
			$course_certs = $wpdb->get_results( "
				SELECT pm.post_id as course_id, pm.meta_value as certificate_id
				FROM {$wpdb->postmeta} pm
				INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
				WHERE p.post_type = 'sfwd-courses'
				AND p.post_status = 'publish'
				AND pm.meta_key IN ('certificate', 'sfwd_certificate', 'learndash_certificate', 'course_certificate')
				AND pm.meta_value != ''
				AND pm.meta_value != '0'
			" );

			foreach ( $course_certs as $row ) {
				$course_id = intval( $row->course_id );
				$cert_id = intval( $row->certificate_id );
				if ( $cert_id > 0 ) {
					$course_certificate_map[$course_id] = $cert_id;
				}
			}

			// Check serialized meta
			$serialized_certs = $wpdb->get_results( "
				SELECT pm.post_id as course_id, pm.meta_value
				FROM {$wpdb->postmeta} pm
				INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID
				WHERE p.post_type = 'sfwd-courses'
				AND p.post_status = 'publish'
				AND pm.meta_key = '_sfwd-courses'
			" );

			foreach ( $serialized_certs as $row ) {
				$meta_value = maybe_unserialize( $row->meta_value );
				if ( is_array( $meta_value ) ) {
					$cert_id = null;
					if ( isset( $meta_value['sfwd-courses_certificate'] ) ) {
						$cert_id = intval( $meta_value['sfwd-courses_certificate'] );
					} elseif ( isset( $meta_value['certificate'] ) ) {
						$cert_id = intval( $meta_value['certificate'] );
					}
					
					if ( $cert_id > 0 ) {
						$course_id = intval( $row->course_id );
						$course_certificate_map[$course_id] = $cert_id;
					}
				}
			}

			// Calculate date range
			$end_date = date( 'Y-m-d 23:59:59' );
			$start_date = date( 'Y-m-d 00:00:00', strtotime( "-{$months_back} months" ) );

			// Get course completions
			$completions = $wpdb->get_results( $wpdb->prepare( "
				SELECT 
					ua.user_id,
					ua.post_id as course_id,
					ua.activity_completed as completion_date
				FROM {$activity_table} ua
				WHERE ua.activity_type = 'course'
				AND ua.activity_status = 1
				AND ua.activity_completed IS NOT NULL
				AND ua.activity_completed != ''
				AND ua.activity_completed != '0'
				AND (
					(ua.activity_completed >= %s AND ua.activity_completed <= %s)
					OR (FROM_UNIXTIME(ua.activity_completed) >= %s AND FROM_UNIXTIME(ua.activity_completed) <= %s)
				)
				ORDER BY ua.activity_completed ASC
			", $start_date, $end_date, $start_date, $end_date ) );

			// Initialize monthly data arrays
			$cpd_monthly_data = array();
			$other_monthly_data = array();
			$total_cpd_issued = 0;
			$total_other_issued = 0;

			// Initialize all months in range
			$current_date = strtotime( $start_date );
			$end_timestamp = strtotime( $end_date );
			
			while ( $current_date <= $end_timestamp ) {
				$month_key = date( 'Y-m', $current_date );
				$month_name = date( 'F', $current_date );
				
				if ( ! isset( $cpd_monthly_data[$month_key] ) ) {
					$cpd_monthly_data[$month_key] = array(
						'month' => $month_name,
						'month_key' => $month_key,
						'sold' => 0,
					);
				}
				
				if ( ! isset( $other_monthly_data[$month_key] ) ) {
					$other_monthly_data[$month_key] = array(
						'month' => $month_name,
						'month_key' => $month_key,
						'sold' => 0,
					);
				}
				
				$current_date = strtotime( '+1 month', $current_date );
			}

			// Process each completion
			foreach ( $completions as $completion ) {
				$course_id = intval( $completion->course_id );
				
				// Check if this course has a certificate
				if ( ! isset( $course_certificate_map[$course_id] ) ) {
					continue; // Course doesn't have a certificate
				}
				
				$cert_id = $course_certificate_map[$course_id];
				$completion_date = $completion->completion_date;
				
				if ( ! $completion_date || $completion_date == '0' ) {
					continue;
				}
				
				// Handle both timestamp and datetime formats
				$timestamp = null;
				if ( is_numeric( $completion_date ) ) {
					// It's a UNIX timestamp
					$timestamp = intval( $completion_date );
				} else {
					// It's a datetime string
					$timestamp = strtotime( $completion_date );
				}
				
				if ( ! $timestamp || $timestamp <= 0 ) {
					continue;
				}
				
				$month_key = date( 'Y-m', $timestamp );
				
				// Check if CPD or Other certificate
				if ( in_array( $cert_id, $cpd_certificate_ids ) ) {
					if ( isset( $cpd_monthly_data[$month_key] ) ) {
						$cpd_monthly_data[$month_key]['sold']++;
						$total_cpd_issued++;
					}
				} elseif ( in_array( $cert_id, $other_certificate_ids ) ) {
					if ( isset( $other_monthly_data[$month_key] ) ) {
						$other_monthly_data[$month_key]['sold']++;
						$total_other_issued++;
					}
				} else {
					// Certificate not in either list, count as "other"
					if ( isset( $other_monthly_data[$month_key] ) ) {
						$other_monthly_data[$month_key]['sold']++;
						$total_other_issued++;
					}
				}
			}

			// Convert to arrays
			$cpd_data = array_values( $cpd_monthly_data );
			$other_data = array_values( $other_monthly_data );

			return new WP_REST_Response( array(
				'success' => true,
				'data' => array(
					'cpd_certificates' => $cpd_data,
					'other_certificates' => $other_data,
					'totals' => array(
						'total_cpd_issued' => $total_cpd_issued,
						'total_other_issued' => $total_other_issued,
						'total_certificates_issued' => $total_cpd_issued + $total_other_issued,
					),
				),
			), 200 );

		} catch ( Exception $e ) {
			error_log( 'Certificate Sales API Error: ' . $e->getMessage() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching certificate sales data.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}
}
