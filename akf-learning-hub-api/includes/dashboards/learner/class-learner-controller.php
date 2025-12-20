<?php
/**
 * Learner Dashboard Controller
 * 
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Learner Dashboard REST Controller
 */
class AKF_Learner_Controller extends AKF_REST_Controller {
	
	/**
	 * Register routes
	 */
	public function register_routes() {
		if ( ! class_exists( 'SFWD_LMS' ) ) {
			error_log( 'LearnDash not active, skipping learner routes.' );
			return;
		}

		register_rest_route( $this->namespace, '/learner-dashboard', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_learner_dashboard' ),
			'permission_callback' => 'is_authenticated_user', // Any authenticated user can access their own dashboard
			'args' => array(
				'period' => array(
					'required' => false,
					'validate_callback' => function( $param ) {
						return in_array( $param, array( '1month', '3months', '6months', '1year', 'all' ) );
					},
				),
				'from' => array(
					'required' => false,
					'sanitize_callback' => 'sanitize_text_field',
				),
				'to' => array(
					'required' => false,
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		) );

		register_rest_route( $this->namespace, '/my-courses', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_my_courses' ),
			'permission_callback' => 'is_authenticated_user', // Any authenticated user can access their own courses
			'args' => array(
				'page' => array(
					'required' => false,
					'default' => 1,
					'sanitize_callback' => 'absint',
				),
				'per_page' => array(
					'required' => false,
					'default' => 12,
					'sanitize_callback' => 'absint',
				),
				'status' => array(
					'required' => false,
					'default' => 'all',
					'validate_callback' => function( $param ) {
						return in_array( $param, array( 'all', 'in-progress', 'completed' ), true );
					},
				),
				'search' => array(
					'required' => false,
					'default' => '',
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		) );

		// Achievements endpoint
		register_rest_route( $this->namespace, '/learner-achievements', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_learner_achievements' ),
			'permission_callback' => 'is_authenticated_user',
		) );

		// Certificates endpoint
		register_rest_route( $this->namespace, '/learner-certificates', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_learner_certificates' ),
			'permission_callback' => 'is_authenticated_user',
		) );

		// Single certificate view endpoint
		register_rest_route( $this->namespace, '/learner-certificates/(?P<certificate_id>\d+)', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_certificate_details' ),
			'permission_callback' => 'is_authenticated_user',
			'args' => array(
				'certificate_id' => array(
					'required' => true,
					'validate_callback' => function( $param ) {
						return is_numeric( $param );
					},
				),
			),
		) );

		// Certificate download endpoint (supports both numeric ID and composite ID like "123_456")
		register_rest_route( $this->namespace, '/learner-certificates/(?P<certificate_id>[^/]+)/download', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'download_certificate' ),
			'permission_callback' => 'is_authenticated_user',
			'args' => array(
				'certificate_id' => array(
					'required' => true,
				),
			),
		) );

		// Certificate view endpoint (supports both numeric ID and composite ID like "123_456")
		register_rest_route( $this->namespace, '/learner-certificates/(?P<certificate_id>[^/]+)/view', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'view_certificate' ),
			'permission_callback' => 'is_authenticated_user',
			'args' => array(
				'certificate_id' => array(
					'required' => true,
				),
			),
		) );

		// Learner settings GET endpoint
		register_rest_route( $this->namespace, '/learner-settings', array(
			'methods'             => 'GET',
			'callback'            => array( $this, 'get_learner_settings' ),
			'permission_callback' => 'is_authenticated_user',
		) );

		// Learner settings UPDATE endpoint
		register_rest_route( $this->namespace, '/learner-settings', array(
			'methods'             => 'PUT',
			'callback'            => array( $this, 'update_learner_settings' ),
			'permission_callback' => 'is_authenticated_user',
		) );
	}
	
	/**
	 * Get learner dashboard data
	 * Returns summary stats, current progress courses, and achievements
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response
	 */
	public function get_learner_dashboard( WP_REST_Request $request ) {
		global $wpdb;

		try {
			// Get current authenticated user
			$user = get_current_auth_user();

			if ( ! $user || ! isset( $user->ID ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}

			$user_id = intval( $user->ID );
			
			if ( $user_id <= 0 ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Invalid user ID.',
				), 400 );
			}

			// Validate LearnDash DB table exists
			$activity_table = $wpdb->prefix . 'learndash_user_activity';
			$exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $activity_table ) );
			
			if ( ! $exists ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'LearnDash activity table not found.',
				), 404 );
			}

			// Get period parameter (optional)
			$period = $request->get_param( 'period' );
			$from_param = $request->get_param( 'from' );
			$to_param = $request->get_param( 'to' );
			$date_query = null;
			$date_query_end = null;
			
			// Custom date range takes precedence over period
			if ( $from_param && $to_param ) {
				// Parse ISO 8601 date strings
				$from_timestamp = strtotime( $from_param );
				$to_timestamp = strtotime( $to_param );
				
				if ( $from_timestamp && $to_timestamp ) {
					$date_query = date( 'Y-m-d H:i:s', $from_timestamp );
					$date_query_end = date( 'Y-m-d H:i:s', $to_timestamp );
				}
			} elseif ( $period && $period !== 'all' ) {
				$current_date = current_time( 'Y-m-d H:i:s' );
				switch ( $period ) {
					case '1month':
						$date_query = date( 'Y-m-d H:i:s', strtotime( '-1 month', strtotime( $current_date ) ) );
						break;
					case '3months':
						$date_query = date( 'Y-m-d H:i:s', strtotime( '-3 months', strtotime( $current_date ) ) );
						break;
					case '6months':
						$date_query = date( 'Y-m-d H:i:s', strtotime( '-6 months', strtotime( $current_date ) ) );
						break;
					case '1year':
						$date_query = date( 'Y-m-d H:i:s', strtotime( '-1 year', strtotime( $current_date ) ) );
						break;
				}
			}

			// Build date filter SQL fragments for reuse
			$date_filter_sql = '';
			$date_filter_params = array();
			if ( $date_query && $date_query_end ) {
				// Custom date range
				$date_filter_sql = ' AND activity_started >= UNIX_TIMESTAMP(%s) AND activity_started <= UNIX_TIMESTAMP(%s)';
				$date_filter_params = array( $date_query, $date_query_end );
			} elseif ( $date_query ) {
				// Period-based (start date only, up to now)
				$date_filter_sql = ' AND activity_started >= UNIX_TIMESTAMP(%s)';
				$date_filter_params = array( $date_query );
			}

			// Get enrolled courses (filtered by date if specified)
			$enrolled_course_ids = array();
			
			if ( $date_query ) {
				// When date filter is active, check both activity table AND enrollment meta
				$from_ts = strtotime( $date_query );
				$to_ts = $date_query_end ? strtotime( $date_query_end ) : time();
				
				// Method 1: Get courses with activity in that period
				if ( $date_query_end ) {
					$activity_courses = $wpdb->get_col( $wpdb->prepare( "
						SELECT DISTINCT post_id
						FROM {$activity_table}
						WHERE user_id = %d
						AND activity_type = 'course'
						AND post_id > 0
						AND activity_started >= UNIX_TIMESTAMP(%s)
						AND activity_started <= UNIX_TIMESTAMP(%s)
					", $user_id, $date_query, $date_query_end ) );
				} else {
					$activity_courses = $wpdb->get_col( $wpdb->prepare( "
						SELECT DISTINCT post_id
						FROM {$activity_table}
						WHERE user_id = %d
						AND activity_type = 'course'
						AND post_id > 0
						AND activity_started >= UNIX_TIMESTAMP(%s)
					", $user_id, $date_query ) );
				}
				$enrolled_course_ids = array_map( 'intval', $activity_courses );
				
				// Method 2: Also check enrollment dates from user meta (course_XXX_access_from)
				// This catches courses that were enrolled but may not have activity records yet
				$access_from_courses = $wpdb->get_results( $wpdb->prepare( "
					SELECT meta_key, meta_value
					FROM {$wpdb->usermeta}
					WHERE user_id = %d
					AND meta_key LIKE 'course_%%_access_from'
					AND meta_value != ''
					AND meta_value != '0'
				", $user_id ) );
				
				foreach ( $access_from_courses as $row ) {
					// Extract course ID from meta_key (format: course_XXXXX_access_from)
					if ( preg_match( '/^course_(\d+)_access_from$/', $row->meta_key, $matches ) ) {
						$course_id = intval( $matches[1] );
						$enrollment_ts = intval( $row->meta_value );
						
						// Check if enrollment date is within the filter range
						if ( $enrollment_ts >= $from_ts && $enrollment_ts <= $to_ts ) {
							if ( ! in_array( $course_id, $enrolled_course_ids ) ) {
								$enrolled_course_ids[] = $course_id;
							}
						}
					}
				}
			} else {
				// No date filter - get all enrolled courses using multiple methods
				
				// METHOD 1: Get courses from learndash_course_access_list user meta
				$access_list_meta = get_user_meta( $user_id, 'learndash_course_access_list', true );
				if ( ! empty( $access_list_meta ) ) {
					if ( is_array( $access_list_meta ) ) {
						$enrolled_course_ids = array_map( 'intval', $access_list_meta );
					} elseif ( is_string( $access_list_meta ) ) {
						$unserialized = maybe_unserialize( $access_list_meta );
						if ( is_array( $unserialized ) ) {
							$enrolled_course_ids = array_map( 'intval', $unserialized );
						}
					}
				}
				
				// METHOD 2: Get courses with access_from meta (direct enrollment)
				$access_from_courses = $wpdb->get_col( $wpdb->prepare( "
					SELECT DISTINCT CAST(SUBSTRING(meta_key, 8, LENGTH(meta_key) - 19) AS UNSIGNED) as course_id
					FROM {$wpdb->usermeta}
					WHERE user_id = %d
					AND meta_key LIKE 'course_%%_access_from'
					AND meta_value != ''
					AND meta_value != '0'
				", $user_id ) );
				
				if ( ! empty( $access_from_courses ) ) {
					$access_from_courses = array_map( 'intval', $access_from_courses );
					$enrolled_course_ids = array_unique( array_merge( $enrolled_course_ids, $access_from_courses ) );
				}
				
				// METHOD 3: Fallback to LearnDash function if available
				if ( function_exists( 'learndash_user_get_enrolled_courses' ) ) {
					$ld_courses = learndash_user_get_enrolled_courses( $user_id, array(), true );
					if ( is_array( $ld_courses ) && ! empty( $ld_courses ) ) {
						$ld_courses = array_map( 'intval', $ld_courses );
						$enrolled_course_ids = array_unique( array_merge( $enrolled_course_ids, $ld_courses ) );
					}
				}
				
				// METHOD 4: For administrators or if still no courses found, check courses with activity
				if ( empty( $enrolled_course_ids ) || in_array( 'administrator', $user->roles ) ) {
					$courses_with_activity = $wpdb->get_col( $wpdb->prepare( "
						SELECT DISTINCT post_id
						FROM {$activity_table}
						WHERE user_id = %d
						AND activity_type = 'course'
						AND post_id > 0
					", $user_id ) );
					
					if ( ! empty( $courses_with_activity ) ) {
						$courses_with_activity = array_map( 'intval', $courses_with_activity );
						$courses_with_activity = array_filter( $courses_with_activity, function( $id ) {
							return $id > 0;
						} );
						
						if ( ! empty( $courses_with_activity ) ) {
							$course_ids_string = implode( ',', $courses_with_activity );
							$published_courses = $wpdb->get_col( "
								SELECT ID
								FROM {$wpdb->posts}
								WHERE ID IN ({$course_ids_string})
								AND post_type = 'sfwd-courses'
								AND post_status = 'publish'
							" );
							
							if ( ! empty( $published_courses ) ) {
								$published_courses = array_map( 'intval', $published_courses );
								$enrolled_course_ids = array_unique( array_merge( $enrolled_course_ids, $published_courses ) );
							}
						}
					}
				}
			}
			
			// Remove duplicates and ensure all are integers
			$enrolled_course_ids = array_unique( array_map( 'intval', $enrolled_course_ids ) );
			$enrolled_course_ids = array_filter( $enrolled_course_ids, function( $id ) {
				return $id > 0;
			} );
			
			$enrolled_count = count( $enrolled_course_ids );

			// Get completed courses (from activity table where status = 1)
			// This was the original working query - restored
			$completed_course_ids = array();
			if ( $date_query && $date_query_end ) {
				// Custom date range - courses completed within the range
				$completed_query = $wpdb->get_results( $wpdb->prepare( "
					SELECT DISTINCT post_id
					FROM {$activity_table}
					WHERE user_id = %d
					AND activity_type = 'course'
					AND activity_status = 1
					AND activity_completed IS NOT NULL
					AND activity_completed != ''
					AND activity_completed != '0'
					AND activity_completed >= UNIX_TIMESTAMP(%s)
					AND activity_completed <= UNIX_TIMESTAMP(%s)
				", $user_id, $date_query, $date_query_end ) );
			} elseif ( $date_query ) {
				// Period-based filter
				$completed_query = $wpdb->get_results( $wpdb->prepare( "
					SELECT DISTINCT post_id
					FROM {$activity_table}
					WHERE user_id = %d
					AND activity_type = 'course'
					AND activity_status = 1
					AND activity_completed IS NOT NULL
					AND activity_completed != ''
					AND activity_completed != '0'
					AND activity_completed >= UNIX_TIMESTAMP(%s)
				", $user_id, $date_query ) );
			} else {
				// No date filter - get all completed courses (original working query)
				$completed_query = $wpdb->get_results( $wpdb->prepare( "
					SELECT DISTINCT post_id
					FROM {$activity_table}
					WHERE user_id = %d
					AND activity_type = 'course'
					AND activity_status = 1
					AND activity_completed IS NOT NULL
					AND activity_completed != ''
					AND activity_completed != '0'
				", $user_id ) );
			}
			$completed_course_ids = array_map( function( $row ) {
				return intval( $row->post_id );
			}, $completed_query );
			$completed_count = count( $completed_course_ids );

			// Get certificates count (courses with certificates that user has completed)
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

			// Count certificates issued to this user
			$certificates_count = 0;
			if ( ! empty( $completed_course_ids ) ) {
				foreach ( $completed_course_ids as $course_id ) {
					$certificate_id = get_post_meta( $course_id, 'certificate', true );
					if ( empty( $certificate_id ) ) {
						$certificate_id = get_post_meta( $course_id, 'sfwd_certificate', true );
					}
					if ( empty( $certificate_id ) ) {
						$course_meta = get_post_meta( $course_id, '_sfwd-courses', true );
						if ( is_array( $course_meta ) && isset( $course_meta['sfwd-courses_certificate'] ) ) {
							$certificate_id = $course_meta['sfwd-courses_certificate'];
						}
					}
					if ( $certificate_id && $certificate_id != '0' ) {
						$certificates_count++;
					}
				}
			}

			// Calculate learning time (total time spent on courses)
			// Method 1: Use completed course time (activity_completed - activity_started)
			// Method 2: Sum time from lessons/topics (more granular and accurate)
			$total_seconds = 0;
			
			// Get time from completed courses (most accurate for completed courses)
			$completed_courses_time_query = $wpdb->prepare( "
				SELECT SUM(
					CASE 
						WHEN activity_completed > activity_started 
						AND activity_completed - activity_started >= 60 
						AND activity_completed - activity_started <= 31536000
						THEN activity_completed - activity_started
						ELSE 0
					END
				) as total_seconds
				FROM {$activity_table}
				WHERE user_id = %d
				AND activity_type = 'course'
				AND activity_status = 1
				AND activity_started > 0
				AND activity_completed > 0
				AND activity_completed > activity_started
			", $user_id );
			
			if ( $date_query ) {
				if ( $date_query_end ) {
					// Custom date range with both start and end
					$completed_courses_time_query = $wpdb->prepare( "
						SELECT SUM(
							CASE 
								WHEN activity_completed > activity_started 
								AND activity_completed - activity_started >= 60 
								AND activity_completed - activity_started <= 31536000
								THEN activity_completed - activity_started
								ELSE 0
							END
						) as total_seconds
						FROM {$activity_table}
						WHERE user_id = %d
						AND activity_type = 'course'
						AND activity_status = 1
						AND activity_started > 0
						AND activity_completed > 0
						AND activity_completed > activity_started
						AND activity_started >= UNIX_TIMESTAMP(%s)
						AND activity_started <= UNIX_TIMESTAMP(%s)
					", $user_id, $date_query, $date_query_end );
				} else {
					// Period-based filter (start date only)
					$completed_courses_time_query = $wpdb->prepare( "
						SELECT SUM(
							CASE 
								WHEN activity_completed > activity_started 
								AND activity_completed - activity_started >= 60 
								AND activity_completed - activity_started <= 31536000
								THEN activity_completed - activity_started
								ELSE 0
							END
						) as total_seconds
						FROM {$activity_table}
						WHERE user_id = %d
						AND activity_type = 'course'
						AND activity_status = 1
						AND activity_started > 0
						AND activity_completed > 0
						AND activity_completed > activity_started
						AND activity_started >= UNIX_TIMESTAMP(%s)
					", $user_id, $date_query );
				}
			}
			
			$completed_courses_seconds = $wpdb->get_var( $completed_courses_time_query );
			$total_seconds += $completed_courses_seconds ? intval( $completed_courses_seconds ) : 0;
			
			// Get time from lessons and topics (more granular, includes in-progress courses)
			// This captures actual time spent on individual content items
			$lessons_time_query = $wpdb->prepare( "
				SELECT SUM(
					CASE 
						WHEN activity_completed > activity_started 
						AND activity_completed - activity_started >= 10 
						AND activity_completed - activity_started <= 7200
						THEN activity_completed - activity_started
						WHEN activity_updated > activity_started 
						AND activity_updated - activity_started >= 10 
						AND activity_updated - activity_started <= 7200
						AND (activity_completed IS NULL OR activity_completed = '' OR activity_completed = '0')
						THEN activity_updated - activity_started
						ELSE 0
					END
				) as total_seconds
				FROM {$activity_table}
				WHERE user_id = %d
				AND activity_type IN ('lesson', 'topic')
				AND activity_started > 0
				AND (
					(activity_completed > activity_started)
					OR (activity_updated > activity_started AND (activity_completed IS NULL OR activity_completed = '' OR activity_completed = '0'))
				)
			", $user_id );
			
			if ( $date_query ) {
				if ( $date_query_end ) {
					// Custom date range with both start and end
					$lessons_time_query = $wpdb->prepare( "
						SELECT SUM(
							CASE 
								WHEN activity_completed > activity_started 
								AND activity_completed - activity_started >= 10 
								AND activity_completed - activity_started <= 7200
								THEN activity_completed - activity_started
								WHEN activity_updated > activity_started 
								AND activity_updated - activity_started >= 10 
								AND activity_updated - activity_started <= 7200
								AND (activity_completed IS NULL OR activity_completed = '' OR activity_completed = '0')
								THEN activity_updated - activity_started
								ELSE 0
							END
						) as total_seconds
						FROM {$activity_table}
						WHERE user_id = %d
						AND activity_type IN ('lesson', 'topic')
						AND activity_started > 0
						AND (
							(activity_completed > activity_started)
							OR (activity_updated > activity_started AND (activity_completed IS NULL OR activity_completed = '' OR activity_completed = '0'))
						)
						AND activity_started >= UNIX_TIMESTAMP(%s)
						AND activity_started <= UNIX_TIMESTAMP(%s)
					", $user_id, $date_query, $date_query_end );
				} else {
					// Period-based filter (start date only)
					$lessons_time_query = $wpdb->prepare( "
						SELECT SUM(
							CASE 
								WHEN activity_completed > activity_started 
								AND activity_completed - activity_started >= 10 
								AND activity_completed - activity_started <= 7200
								THEN activity_completed - activity_started
								WHEN activity_updated > activity_started 
								AND activity_updated - activity_started >= 10 
								AND activity_updated - activity_started <= 7200
								AND (activity_completed IS NULL OR activity_completed = '' OR activity_completed = '0')
								THEN activity_updated - activity_started
								ELSE 0
							END
						) as total_seconds
						FROM {$activity_table}
						WHERE user_id = %d
						AND activity_type IN ('lesson', 'topic')
						AND activity_started > 0
						AND (
							(activity_completed > activity_started)
							OR (activity_updated > activity_started AND (activity_completed IS NULL OR activity_completed = '' OR activity_completed = '0'))
						)
						AND activity_started >= UNIX_TIMESTAMP(%s)
					", $user_id, $date_query );
				}
			}
			
			$lessons_seconds = $wpdb->get_var( $lessons_time_query );
			$total_seconds += $lessons_seconds ? intval( $lessons_seconds ) : 0;
			
			// If we still don't have time, try to estimate from quiz attempts
			// (as a fallback, though this is less accurate)
			if ( $total_seconds == 0 ) {
				$quiz_time_query = $wpdb->prepare( "
					SELECT SUM(
						CASE 
							WHEN activity_completed > activity_started 
							AND activity_completed - activity_started >= 30 
							AND activity_completed - activity_started <= 3600
							THEN activity_completed - activity_started
							ELSE 0
						END
					) as total_seconds
					FROM {$activity_table}
					WHERE user_id = %d
					AND activity_type = 'quiz'
					AND activity_started > 0
					AND activity_completed > activity_started
				", $user_id );
				
				if ( $date_query ) {
					if ( $date_query_end ) {
						// Custom date range with both start and end
						$quiz_time_query = $wpdb->prepare( "
							SELECT SUM(
								CASE 
									WHEN activity_completed > activity_started 
									AND activity_completed - activity_started >= 30 
									AND activity_completed - activity_started <= 3600
									THEN activity_completed - activity_started
									ELSE 0
								END
							) as total_seconds
							FROM {$activity_table}
							WHERE user_id = %d
							AND activity_type = 'quiz'
							AND activity_started > 0
							AND activity_completed > activity_started
							AND activity_started >= UNIX_TIMESTAMP(%s)
							AND activity_started <= UNIX_TIMESTAMP(%s)
						", $user_id, $date_query, $date_query_end );
					} else {
						// Period-based filter (start date only)
						$quiz_time_query = $wpdb->prepare( "
							SELECT SUM(
								CASE 
									WHEN activity_completed > activity_started 
									AND activity_completed - activity_started >= 30 
									AND activity_completed - activity_started <= 3600
									THEN activity_completed - activity_started
									ELSE 0
								END
							) as total_seconds
							FROM {$activity_table}
							WHERE user_id = %d
							AND activity_type = 'quiz'
							AND activity_started > 0
							AND activity_completed > activity_started
							AND activity_started >= UNIX_TIMESTAMP(%s)
						", $user_id, $date_query );
					}
				}
				
				$quiz_seconds = $wpdb->get_var( $quiz_time_query );
				$total_seconds += $quiz_seconds ? intval( $quiz_seconds ) : 0;
			}
			
			// Fallback: Try to get learning time from LearnDash user meta if still 0
			// LearnDash stores cumulative time in user meta for some configurations
			if ( $total_seconds == 0 && ! $date_query ) {
				// Check for LearnDash course time tracking meta
				$ld_time_meta = get_user_meta( $user_id, 'learndash_course_time', true );
				if ( ! empty( $ld_time_meta ) && is_numeric( $ld_time_meta ) ) {
					$total_seconds = intval( $ld_time_meta );
				}
				
				// Also check individual course time metas
				if ( $total_seconds == 0 && ! empty( $enrolled_course_ids ) ) {
					foreach ( $enrolled_course_ids as $course_id ) {
						$course_time = get_user_meta( $user_id, 'course_time_' . $course_id, true );
						if ( ! empty( $course_time ) && is_numeric( $course_time ) ) {
							$total_seconds += intval( $course_time );
						}
					}
				}
			}
			
			// Format learning time - show hours and minutes for better granularity
			if ( $total_seconds >= 3600 ) {
				$hours = floor( $total_seconds / 3600 );
				$minutes = floor( ( $total_seconds % 3600 ) / 60 );
				if ( $minutes > 0 ) {
					$learning_time = $hours . 'H ' . $minutes . 'M';
				} else {
					$learning_time = $hours . 'H';
				}
			} elseif ( $total_seconds >= 60 ) {
				$minutes = floor( $total_seconds / 60 );
				$learning_time = $minutes . 'M';
			} else {
				$learning_time = '0H';
			}

			// Get current progress courses (enrolled but not completed)
			// Ensure both arrays contain integers for proper comparison
			$enrolled_course_ids = array_map( 'intval', $enrolled_course_ids );
			$completed_course_ids = array_map( 'intval', $completed_course_ids );
			$in_progress_course_ids = array_diff( $enrolled_course_ids, $completed_course_ids );
			$current_progress = array();

			if ( ! empty( $in_progress_course_ids ) ) {
				foreach ( $in_progress_course_ids as $course_id ) {
					$course_id = intval( $course_id );
					if ( $course_id <= 0 ) {
						continue;
					}
					
					$course = get_post( $course_id );
					if ( ! $course || ! isset( $course->post_status ) || $course->post_status !== 'publish' ) {
						continue;
					}

					// Get course progress
					$progress_percentage = 0;
					if ( function_exists( 'learndash_course_progress' ) ) {
						try {
							$progress = learndash_course_progress( array(
								'user_id' => $user_id,
								'course_id' => $course_id,
								'array' => true,
							) );
							$progress_percentage = isset( $progress['percentage'] ) ? intval( $progress['percentage'] ) : 0;
						} catch ( Exception $e ) {
							error_log( 'Error getting course progress: ' . $e->getMessage() );
							// Default to 0 if there's an error
							$progress_percentage = 0;
						}
					}
					
					// Ensure progress is between 0 and 100
					$progress_percentage = max( 0, min( 100, $progress_percentage ) );

					// Get course thumbnail
					$thumbnail_id = get_post_thumbnail_id( $course_id );
					$thumbnail_url = $thumbnail_id ? wp_get_attachment_image_url( $thumbnail_id, 'thumbnail' ) : '';

					// Get resume course URL (where user left off)
					$resume_url = get_permalink( $course_id ); // Default to course page
					$found_resume = false;
					
					// Method 1: Check last known page from user meta (most accurate - stores last visited post ID)
					// Format: learndash_last_known_course_{course_id} = {post_id}
					$last_known = get_user_meta( $user_id, 'learndash_last_known_course_' . $course_id, true );
					if ( ! empty( $last_known ) && intval( $last_known ) > 0 ) {
						$last_known_url = get_permalink( intval( $last_known ) );
						if ( ! empty( $last_known_url ) && $last_known_url !== $resume_url ) {
							$resume_url = $last_known_url;
							$found_resume = true;
						}
					}
					
					// Method 2: Try LearnDash's built-in resume link function
					if ( ! $found_resume && function_exists( 'learndash_get_course_resume_link' ) ) {
						$resume_link = learndash_get_course_resume_link( $course_id, $user_id );
						if ( ! empty( $resume_link ) && $resume_link !== get_permalink( $course_id ) ) {
							$resume_url = $resume_link;
							$found_resume = true;
						}
					}
					
					// Method 3: Get first incomplete step
					if ( ! $found_resume && function_exists( 'learndash_user_progress_get_first_incomplete_step' ) ) {
						$incomplete_step = learndash_user_progress_get_first_incomplete_step( $user_id, $course_id );
						if ( ! empty( $incomplete_step ) && isset( $incomplete_step['post_id'] ) && intval( $incomplete_step['post_id'] ) > 0 ) {
							$step_url = get_permalink( intval( $incomplete_step['post_id'] ) );
							if ( ! empty( $step_url ) ) {
								$resume_url = $step_url;
								$found_resume = true;
							}
						}
					}
					
					// Method 4: Check course progress meta for last completed item and get next
					if ( ! $found_resume ) {
						$course_progress = get_user_meta( $user_id, '_sfwd-course_progress', true );
						if ( ! empty( $course_progress ) && isset( $course_progress[ $course_id ] ) ) {
							$progress_data = $course_progress[ $course_id ];
							// Get last_id which is the last accessed content
							if ( isset( $progress_data['last_id'] ) && intval( $progress_data['last_id'] ) > 0 ) {
								$last_id_url = get_permalink( intval( $progress_data['last_id'] ) );
								if ( ! empty( $last_id_url ) ) {
									$resume_url = $last_id_url;
									$found_resume = true;
								}
							}
						}
					}

					$current_progress[] = array(
						'id' => $course_id,
						'title' => isset( $course->post_title ) ? $course->post_title : 'Untitled Course',
						'progress' => $progress_percentage,
						'thumbnail' => $thumbnail_url ? $thumbnail_url : '',
						'resume_url' => $resume_url,
					);
				}
			}

			// Sort by progress descending
			usort( $current_progress, function( $a, $b ) {
				return $b['progress'] - $a['progress'];
			} );

			// Limit to 5 most recent/in-progress courses
			$current_progress = array_slice( $current_progress, 0, 5 );

			// Get recent achievements (based on course completions and quiz scores)
			$achievements = array();

			// Achievement: First Course Completed
			if ( $completed_count >= 1 ) {
				$first_completion = $wpdb->get_var( $wpdb->prepare( "
					SELECT MIN(activity_completed)
					FROM {$activity_table}
					WHERE user_id = %d
					AND activity_type = 'course'
					AND activity_status = 1
					AND activity_completed IS NOT NULL
					AND activity_completed != ''
					AND activity_completed != '0'
				", $user_id ) );
				if ( $first_completion ) {
					$timestamp = is_numeric( $first_completion ) ? intval( $first_completion ) : strtotime( $first_completion );
					$achievements[] = array(
						'id' => 1,
						'title' => 'First Course Completed',
						'description' => 'Completed your first course successfully',
						'date' => date( 'Y-m-d', $timestamp ),
						'type' => 'first_completion',
					);
				}
			}

			// Achievement: Quick Learner (completed course in under 2 weeks)
			$quick_learner = $wpdb->get_var( $wpdb->prepare( "
				SELECT COUNT(DISTINCT ua.post_id)
				FROM {$activity_table} ua
				WHERE ua.user_id = %d
				AND ua.activity_type = 'course'
				AND ua.activity_status = 1
				AND ua.activity_completed IS NOT NULL
				AND ua.activity_completed != ''
				AND ua.activity_completed != '0'
				AND ua.activity_started IS NOT NULL
				AND ua.activity_started != ''
				AND ua.activity_started != '0'
				AND (
					(ua.activity_completed - ua.activity_started) < 1209600
					OR (UNIX_TIMESTAMP(ua.activity_completed) - ua.activity_started) < 1209600
				)
			", $user_id ) );
			if ( $quick_learner && $quick_learner > 0 ) {
				$quick_completion = $wpdb->get_var( $wpdb->prepare( "
					SELECT MAX(activity_completed)
					FROM {$activity_table}
					WHERE user_id = %d
					AND activity_type = 'course'
					AND activity_status = 1
					AND activity_completed IS NOT NULL
					AND activity_completed != ''
					AND activity_completed != '0'
					AND activity_started IS NOT NULL
					AND activity_started != ''
					AND activity_started != '0'
					AND (
						(activity_completed - activity_started) < 1209600
						OR (UNIX_TIMESTAMP(activity_completed) - activity_started) < 1209600
					)
				", $user_id ) );
				if ( $quick_completion ) {
					$timestamp = is_numeric( $quick_completion ) ? intval( $quick_completion ) : strtotime( $quick_completion );
					$achievements[] = array(
						'id' => 2,
						'title' => 'Quick Learner',
						'description' => 'Completed a course in under 2 weeks',
						'date' => date( 'Y-m-d', $timestamp ),
						'type' => 'quick_learner',
					);
				}
			}

			// Achievement: High Achiever (scored 90% or higher on 3+ courses)
			$meta_table = $wpdb->prefix . 'learndash_user_activity_meta';
			$meta_table_exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $meta_table ) );
			
			if ( $meta_table_exists ) {
				$high_scores = $wpdb->get_var( $wpdb->prepare( "
					SELECT COUNT(DISTINCT ua.post_id)
					FROM {$activity_table} ua
					INNER JOIN {$meta_table} uam ON ua.activity_id = uam.activity_id
					WHERE ua.user_id = %d
					AND ua.activity_type = 'quiz'
					AND uam.activity_meta_key = 'percentage'
					AND CAST(uam.activity_meta_value AS DECIMAL(5,2)) >= 90
				", $user_id ) );
				if ( $high_scores && $high_scores >= 3 ) {
					$high_score_date = $wpdb->get_var( $wpdb->prepare( "
						SELECT MAX(ua.activity_completed)
						FROM {$activity_table} ua
						INNER JOIN {$meta_table} uam ON ua.activity_id = uam.activity_id
						WHERE ua.user_id = %d
						AND ua.activity_type = 'quiz'
						AND uam.activity_meta_key = 'percentage'
						AND CAST(uam.activity_meta_value AS DECIMAL(5,2)) >= 90
					", $user_id ) );
					if ( $high_score_date ) {
						$timestamp = is_numeric( $high_score_date ) ? intval( $high_score_date ) : strtotime( $high_score_date );
						$achievements[] = array(
							'id' => 3,
							'title' => 'High Achiever',
							'description' => 'Scored 90% or higher on 3 courses',
							'date' => date( 'Y-m-d', $timestamp ),
							'type' => 'high_achiever',
						);
					}
				}
			}

			// Sort achievements by date descending (most recent first)
			usort( $achievements, function( $a, $b ) {
				return strtotime( $b['date'] ) - strtotime( $a['date'] );
			} );

			// Limit to 3 most recent achievements
			$achievements = array_slice( $achievements, 0, 3 );

			// Build response
			$response = array(
				'success' => true,
				'data' => array(
					'summary' => array(
						'courses_enrolled' => $enrolled_count,
						'courses_completed' => $completed_count,
						'certificates' => $certificates_count,
						'learning_time' => $learning_time,
					),
					'current_progress' => $current_progress,
					'achievements' => $achievements,
				),
			);

			return new WP_REST_Response( $response, 200 );

		} catch ( Exception $e ) {
			error_log( 'Learner Dashboard API Error: ' . $e->getMessage() );
			error_log( 'Stack trace: ' . $e->getTraceAsString() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching learner dashboard data.',
				'details' => $e->getMessage(),
				'file' => $e->getFile(),
				'line' => $e->getLine(),
			), 500 );
		} catch ( Error $e ) {
			error_log( 'Learner Dashboard API Fatal Error: ' . $e->getMessage() );
			error_log( 'Stack trace: ' . $e->getTraceAsString() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'A fatal error occurred while fetching learner dashboard data.',
				'details' => $e->getMessage(),
				'file' => $e->getFile(),
				'line' => $e->getLine(),
			), 500 );
		}
	}

	/**
	 * Get My Courses - Returns enrolled courses with progress, lessons, and status
	 * Supports pagination and filtering (all, in-progress, completed)
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response
	 */
	public function get_my_courses( WP_REST_Request $request ) {
		global $wpdb;

		try {
			// Get current authenticated user
			$user = get_current_auth_user();
			if ( ! $user || ! isset( $user->ID ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}

			$user_id = intval( $user->ID );
			
			if ( $user_id <= 0 ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Invalid user ID.',
				), 400 );
			}

			// Validate LearnDash DB table exists
			$activity_table = $wpdb->prefix . 'learndash_user_activity';
			$exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $activity_table ) );
			
			if ( ! $exists ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'LearnDash activity table not found.',
				), 404 );
			}

			// Get query parameters
			$page = max( 1, intval( $request->get_param( 'page' ) ) ?: 1 );
			$per_page = max( 1, min( 50, intval( $request->get_param( 'per_page' ) ) ?: 12 ) ); // Default 12, max 50
			$status_filter = sanitize_text_field( $request->get_param( 'status' ) ?: 'all' ); // all, in-progress, completed
			$search = sanitize_text_field( $request->get_param( 'search' ) ?: '' );

			// Get enrolled courses using the same logic as learner dashboard
			$enrolled_course_ids = array();
			
			// METHOD 1: Get courses from learndash_course_access_list user meta
			$access_list_meta = get_user_meta( $user_id, 'learndash_course_access_list', true );
			if ( ! empty( $access_list_meta ) ) {
				if ( is_array( $access_list_meta ) ) {
					$enrolled_course_ids = array_map( 'intval', $access_list_meta );
				} elseif ( is_string( $access_list_meta ) ) {
					$unserialized = maybe_unserialize( $access_list_meta );
					if ( is_array( $unserialized ) ) {
						$enrolled_course_ids = array_map( 'intval', $unserialized );
					}
				}
			}
			
			// METHOD 2: Get courses with access_from meta (direct enrollment)
			$access_from_courses = $wpdb->get_col( $wpdb->prepare( "
				SELECT DISTINCT CAST(SUBSTRING(meta_key, 8, LENGTH(meta_key) - 19) AS UNSIGNED) as course_id
				FROM {$wpdb->usermeta}
				WHERE user_id = %d
				AND meta_key LIKE 'course_%%_access_from'
				AND meta_value != ''
				AND meta_value != '0'
			", $user_id ) );
			
			if ( ! empty( $access_from_courses ) ) {
				$access_from_courses = array_map( 'intval', $access_from_courses );
				$enrolled_course_ids = array_unique( array_merge( $enrolled_course_ids, $access_from_courses ) );
			}
			
			// METHOD 3: Fallback to LearnDash function if available
			if ( function_exists( 'learndash_user_get_enrolled_courses' ) ) {
				$ld_courses = learndash_user_get_enrolled_courses( $user_id, array(), true );
				if ( is_array( $ld_courses ) && ! empty( $ld_courses ) ) {
					$ld_courses = array_map( 'intval', $ld_courses );
					$enrolled_course_ids = array_unique( array_merge( $enrolled_course_ids, $ld_courses ) );
				}
			}
			
			// METHOD 4: For administrators or if still no courses found, check courses with activity
			if ( empty( $enrolled_course_ids ) || in_array( 'administrator', $user->roles, true ) ) {
				$courses_with_activity = $wpdb->get_col( $wpdb->prepare( "
					SELECT DISTINCT post_id
					FROM {$activity_table}
					WHERE user_id = %d
					AND activity_type = 'course'
					AND post_id > 0
				", $user_id ) );
				
				if ( ! empty( $courses_with_activity ) ) {
					$courses_with_activity = array_map( 'intval', $courses_with_activity );
					$courses_with_activity = array_filter( $courses_with_activity, function( $id ) {
						return $id > 0;
					} );
					
					if ( ! empty( $courses_with_activity ) ) {
						$course_ids_string = implode( ',', $courses_with_activity );
						$published_courses = $wpdb->get_col( "
							SELECT ID
							FROM {$wpdb->posts}
							WHERE ID IN ({$course_ids_string})
							AND post_type = 'sfwd-courses'
							AND post_status = 'publish'
						" );
						
						if ( ! empty( $published_courses ) ) {
							$published_courses = array_map( 'intval', $published_courses );
							$enrolled_course_ids = array_unique( array_merge( $enrolled_course_ids, $published_courses ) );
						}
					}
				}
			}
			
			// Remove duplicates and ensure all are integers
			$enrolled_course_ids = array_unique( array_map( 'intval', $enrolled_course_ids ) );
			$enrolled_course_ids = array_filter( $enrolled_course_ids, function( $id ) {
				return $id > 0;
			} );

			if ( empty( $enrolled_course_ids ) ) {
				return new WP_REST_Response( array(
					'success' => true,
					'data' => array(),
					'pagination' => array(
						'current_page' => $page,
						'per_page' => $per_page,
						'total_items' => 0,
						'total_pages' => 0,
					),
				), 200 );
			}

			// Get completed course IDs
			$completed_course_ids = array();
			$completed_query = $wpdb->get_results( $wpdb->prepare( "
				SELECT DISTINCT post_id
				FROM {$activity_table}
				WHERE user_id = %d
				AND activity_type = 'course'
				AND activity_status = 1
				AND activity_completed IS NOT NULL
				AND activity_completed != ''
				AND activity_completed != '0'
			", $user_id ) );
			$completed_course_ids = array_map( function( $row ) {
				return intval( $row->post_id );
			}, $completed_query );

			// Filter courses by status
			$filtered_course_ids = $enrolled_course_ids;
			if ( $status_filter === 'completed' ) {
				$filtered_course_ids = array_intersect( $enrolled_course_ids, $completed_course_ids );
			} elseif ( $status_filter === 'in-progress' ) {
				$filtered_course_ids = array_diff( $enrolled_course_ids, $completed_course_ids );
			}

			// Apply search filter if provided
			if ( ! empty( $search ) && ! empty( $filtered_course_ids ) ) {
				$course_ids_string = implode( ',', array_map( 'intval', $filtered_course_ids ) );
				$search_term = '%' . $wpdb->esc_like( $search ) . '%';
				$search_course_ids = $wpdb->get_col( $wpdb->prepare( "
					SELECT ID
					FROM {$wpdb->posts}
					WHERE ID IN ({$course_ids_string})
					AND post_title LIKE %s
					AND post_type = 'sfwd-courses'
					AND post_status = 'publish'
				", $search_term ) );
				
				if ( ! empty( $search_course_ids ) ) {
					$filtered_course_ids = array_intersect( $filtered_course_ids, array_map( 'intval', $search_course_ids ) );
				} else {
					$filtered_course_ids = array();
				}
			}

			// Re-index array after filtering
			$filtered_course_ids = array_values( $filtered_course_ids );

			// Calculate pagination
			$total_items = count( $filtered_course_ids );
			$total_pages = ceil( $total_items / $per_page );
			$offset = ( $page - 1 ) * $per_page;
			$paginated_course_ids = array_slice( $filtered_course_ids, $offset, $per_page );

			// Build course data
			$courses = array();
			foreach ( $paginated_course_ids as $course_id ) {
				$course_id = intval( $course_id );
				if ( $course_id <= 0 ) {
					continue;
				}
				
				$course = get_post( $course_id );
				if ( ! $course || $course->post_status !== 'publish' ) {
					continue;
				}

				// Get course progress
				$progress_percentage = 0;
				if ( function_exists( 'learndash_course_progress' ) ) {
					try {
						$progress = learndash_course_progress( array(
							'user_id' => $user_id,
							'course_id' => $course_id,
							'array' => true,
						) );
						$progress_percentage = isset( $progress['percentage'] ) ? intval( $progress['percentage'] ) : 0;
					} catch ( Exception $e ) {
						error_log( 'Error getting course progress: ' . $e->getMessage() );
						$progress_percentage = 0;
					}
				}
				
				$progress_percentage = max( 0, min( 100, $progress_percentage ) );

				// Get lessons count (total steps: lessons + topics)
				$total_lessons = 0;
				$completed_lessons = 0;
				
				// Get total lessons and topics from course structure
				if ( function_exists( 'learndash_get_course_steps' ) ) {
					$course_steps = learndash_get_course_steps( $course_id );
					if ( is_array( $course_steps ) ) {
						// Count all steps (lessons and topics)
						foreach ( $course_steps as $lesson_id => $topics ) {
							$total_lessons++; // Count the lesson
							if ( is_array( $topics ) ) {
								$total_lessons += count( $topics ); // Count topics
							}
						}
					}
				}
				
				// Fallback: Count from database if LearnDash function not available
				if ( $total_lessons == 0 ) {
					$total_steps_query = $wpdb->get_var( $wpdb->prepare( "
						SELECT COUNT(DISTINCT p.ID)
						FROM {$wpdb->posts} p
						INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
						WHERE pm.meta_key = 'course_id'
						AND pm.meta_value = %d
						AND p.post_type IN ('sfwd-lessons', 'sfwd-topic')
						AND p.post_status = 'publish'
					", $course_id ) );
					
					if ( $total_steps_query ) {
						$total_lessons = intval( $total_steps_query );
					}
				}

				// Get completed lessons/topics count from activity table
				$completed_lessons_query = $wpdb->get_var( $wpdb->prepare( "
					SELECT COUNT(DISTINCT post_id)
					FROM {$activity_table}
					WHERE user_id = %d
					AND course_id = %d
					AND activity_type IN ('lesson', 'topic')
					AND activity_status = 1
				", $user_id, $course_id ) );
				
				if ( $completed_lessons_query ) {
					$completed_lessons = intval( $completed_lessons_query );
				}
				
				// Fallback: If still no total, use completed count as minimum
				if ( $total_lessons == 0 && $completed_lessons > 0 ) {
					$total_lessons = $completed_lessons;
				}

				// Determine status
				$is_completed = in_array( $course_id, $completed_course_ids, true ) || $progress_percentage >= 100;
				$status = $is_completed ? 'completed' : 'in-progress';

				// Get course thumbnail
				$thumbnail_id = get_post_thumbnail_id( $course_id );
				$thumbnail_url = $thumbnail_id ? wp_get_attachment_image_url( $thumbnail_id, 'medium' ) : '';

				// Get course author/instructor
				$author_id = $course->post_author;
				$instructor = '';
				if ( $author_id ) {
					$author = get_userdata( $author_id );
					$instructor = $author ? $author->display_name : '';
				}

				// Generate a color based on course ID (for consistent icon colors)
				$colors = array(
					'#FDB022', // Yellow
					'#00BCD4', // Cyan
					'#FF6B6B', // Red
					'#C2185B', // Pink
					'#4CAF50', // Green
					'#2196F3', // Blue
					'#FF9800', // Orange
					'#9C27B0', // Purple
				);
				$color = $colors[ $course_id % count( $colors ) ];

				$courses[] = array(
					'id' => $course_id,
					'title' => $course->post_title,
					'instructor' => $instructor,
					'progress' => $progress_percentage,
					'totalLessons' => $total_lessons,
					'completedLessons' => $completed_lessons,
					'status' => $status,
					'color' => $color,
					'thumbnail' => $thumbnail_url,
					'link' => get_permalink( $course_id ),
				);
			}

			// Sort courses: completed first, then by progress descending
			usort( $courses, function( $a, $b ) {
				if ( $a['status'] === 'completed' && $b['status'] !== 'completed' ) {
					return -1;
				}
				if ( $a['status'] !== 'completed' && $b['status'] === 'completed' ) {
					return 1;
				}
				return $b['progress'] - $a['progress'];
			} );

			return new WP_REST_Response( array(
				'success' => true,
				'data' => $courses,
				'pagination' => array(
					'current_page' => $page,
					'per_page' => $per_page,
					'total_items' => $total_items,
					'total_pages' => $total_pages,
				),
			), 200 );

		} catch ( Exception $e ) {
			error_log( 'My Courses API Error: ' . $e->getMessage() );
			error_log( 'Stack trace: ' . $e->getTraceAsString() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching courses.',
				'details' => $e->getMessage(),
			), 500 );
		} catch ( Error $e ) {
			error_log( 'My Courses API Fatal Error: ' . $e->getMessage() );
			error_log( 'Stack trace: ' . $e->getTraceAsString() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'A fatal error occurred while fetching courses.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}

	/**
	 * Get learner achievements data
	 * Returns stats, goals, badges, and achievements
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response
	 */
	public function get_learner_achievements( WP_REST_Request $request ) {
		global $wpdb;

		try {
			// Get current authenticated user
			$user = get_current_auth_user();

			if ( ! $user || ! isset( $user->ID ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}

			$user_id = intval( $user->ID );
			
			if ( $user_id <= 0 ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Invalid user ID.',
				), 400 );
			}

			// Get activity table
			$activity_table = $wpdb->prefix . 'learndash_user_activity';

			// =====================
			// 1. GET ENROLLED COURSES
			// =====================
			$enrolled_course_ids = $this->get_user_enrolled_courses( $user_id );
			
			// =====================
			// 2. GET COMPLETED COURSES
			// =====================
			$completed_courses = array();
			$completed_course_ids = array();
			
			if ( ! empty( $enrolled_course_ids ) ) {
				$completed_query = $wpdb->get_results( $wpdb->prepare( "
					SELECT post_id, activity_completed
					FROM {$activity_table}
					WHERE user_id = %d
					AND activity_type = 'course'
					AND activity_status = 1
					AND activity_completed IS NOT NULL
					AND activity_completed != ''
					AND activity_completed != '0'
				", $user_id ) );
				
				foreach ( $completed_query as $row ) {
					$course_id = intval( $row->post_id );
					if ( in_array( $course_id, $enrolled_course_ids ) ) {
						$completed_course_ids[] = $course_id;
						$completed_courses[] = array(
							'course_id' => $course_id,
							'completed_date' => $row->activity_completed,
						);
					}
				}
			}

			// =====================
			// 3. CALCULATE STATS
			// =====================
			$total_enrolled = count( $enrolled_course_ids );
			$total_completed = count( $completed_course_ids );
			$completion_rate = $total_enrolled > 0 ? round( ( $total_completed / $total_enrolled ) * 100 ) : 0;
			
			// Get badges earned this month
			$this_month_start = date( 'Y-m-01 00:00:00' );
			$badges_this_month = 0;
			foreach ( $completed_courses as $course ) {
				$completed_date = date( 'Y-m-d H:i:s', intval( $course['completed_date'] ) );
				if ( $completed_date >= $this_month_start ) {
					$badges_this_month++;
				}
			}

			// Calculate total badges (completed courses + login streaks + other achievements)
			$total_badges = $total_completed;
			
			// Add login streak badges
			$login_count = $this->get_user_login_count( $user_id );
			if ( $login_count >= 1 ) $total_badges++; // Rookie badge
			if ( $login_count >= 10 ) $total_badges++; // Veteran badge
			if ( $login_count >= 30 ) $total_badges++; // Consistent Learner badge

			$stats = array(
				array( 'label' => 'Total Badges', 'value' => strval( $total_badges ) ),
				array( 'label' => 'This Month', 'value' => strval( $badges_this_month ) ),
				array( 'label' => 'Completion Rate', 'value' => $completion_rate . '%' ),
			);

			// =====================
			// 4. NEXT GOAL
			// =====================
			$courses_to_expert = 5;
			$progress_to_expert = min( $total_completed, $courses_to_expert );
			
			$next_goal = array(
				'title' => 'Your next goal!',
				'description' => 'Complete ' . ( $courses_to_expert - $progress_to_expert ) . ' more courses to unlock the Expert badge',
				'progress' => $progress_to_expert,
				'total' => $courses_to_expert,
			);

			// If expert badge achieved, set next goal
			if ( $progress_to_expert >= $courses_to_expert ) {
				$next_goal = array(
					'title' => 'Your next goal!',
					'description' => 'Complete 10 courses to unlock the Master badge',
					'progress' => min( $total_completed, 10 ),
					'total' => 10,
				);
			}

			// =====================
			// 5. LATEST GOALS (Login-based achievements)
			// =====================
			$latest_goals = array();
			
			if ( $login_count >= 10 ) {
				$latest_goals[] = array(
					'id' => 1,
					'title' => 'Veteran',
					'description' => 'Logged in 10 times',
					'icon' => 'Check',
					'color' => 'bg-green-600',
					'status' => 'Completed',
				);
			}
			
			if ( $login_count >= 1 ) {
				$latest_goals[] = array(
					'id' => 2,
					'title' => 'Rookie',
					'description' => 'First time logged in',
					'icon' => 'User',
					'color' => 'bg-blue-600',
					'status' => 'Completed',
				);
			}

			// =====================
			// 6. WIZARD BADGES (Category-based)
			// =====================
			$wizard_badges = $this->get_wizard_badges( $user_id, $completed_course_ids );

			// =====================
			// 7. ACHIEVEMENTS (Course completions and milestones)
			// =====================
			$achievements = $this->get_user_achievements( $user_id, $completed_courses, $login_count );

			return new WP_REST_Response( array(
				'success' => true,
				'data' => array(
					'stats' => $stats,
					'next_goal' => $next_goal,
					'latest_goals' => $latest_goals,
					'wizard_badges' => $wizard_badges,
					'achievements' => $achievements,
				),
			), 200 );

		} catch ( Exception $e ) {
			error_log( 'Learner Achievements API Error: ' . $e->getMessage() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching achievements.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}

	/**
	 * Get user's enrolled courses
	 *
	 * @param int $user_id User ID
	 * @return array Array of course IDs
	 */
	private function get_user_enrolled_courses( $user_id ) {
		global $wpdb;
		
		$enrolled_course_ids = array();
		$activity_table = $wpdb->prefix . 'learndash_user_activity';
		
		// METHOD 1: Get courses from learndash_course_access_list user meta
		$access_list_meta = get_user_meta( $user_id, 'learndash_course_access_list', true );
		if ( ! empty( $access_list_meta ) ) {
			if ( is_array( $access_list_meta ) ) {
				$enrolled_course_ids = array_map( 'intval', $access_list_meta );
			} elseif ( is_string( $access_list_meta ) ) {
				$unserialized = maybe_unserialize( $access_list_meta );
				if ( is_array( $unserialized ) ) {
					$enrolled_course_ids = array_map( 'intval', $unserialized );
				}
			}
		}
		
		// METHOD 2: Get courses with access_from meta
		$access_from_courses = $wpdb->get_col( $wpdb->prepare( "
			SELECT DISTINCT CAST(SUBSTRING(meta_key, 8, LENGTH(meta_key) - 19) AS UNSIGNED) as course_id
			FROM {$wpdb->usermeta}
			WHERE user_id = %d
			AND meta_key LIKE 'course_%%_access_from'
			AND meta_value != ''
			AND meta_value != '0'
		", $user_id ) );
		
		if ( ! empty( $access_from_courses ) ) {
			$access_from_courses = array_map( 'intval', $access_from_courses );
			$enrolled_course_ids = array_unique( array_merge( $enrolled_course_ids, $access_from_courses ) );
		}
		
		// METHOD 3: Fallback to LearnDash function
		if ( function_exists( 'learndash_user_get_enrolled_courses' ) ) {
			$ld_courses = learndash_user_get_enrolled_courses( $user_id, array(), true );
			if ( is_array( $ld_courses ) && ! empty( $ld_courses ) ) {
				$ld_courses = array_map( 'intval', $ld_courses );
				$enrolled_course_ids = array_unique( array_merge( $enrolled_course_ids, $ld_courses ) );
			}
		}
		
		// METHOD 4: Check courses with activity
		$courses_with_activity = $wpdb->get_col( $wpdb->prepare( "
			SELECT DISTINCT post_id
			FROM {$activity_table}
			WHERE user_id = %d
			AND activity_type = 'course'
			AND post_id > 0
		", $user_id ) );
		
		if ( ! empty( $courses_with_activity ) ) {
			$courses_with_activity = array_map( 'intval', $courses_with_activity );
			$enrolled_course_ids = array_unique( array_merge( $enrolled_course_ids, $courses_with_activity ) );
		}
		
		return array_filter( array_unique( $enrolled_course_ids ), function( $id ) {
			return $id > 0;
		} );
	}

	/**
	 * Get user login count
	 *
	 * @param int $user_id User ID
	 * @return int Login count
	 */
	private function get_user_login_count( $user_id ) {
		// Try to get from user meta (if tracked)
		$login_count = get_user_meta( $user_id, 'akf_login_count', true );
		
		if ( ! empty( $login_count ) ) {
			return intval( $login_count );
		}
		
		// Fallback: Check session tracking if available
		global $wpdb;
		$sessions_table = $wpdb->prefix . 'akf_user_sessions';
		
		$table_exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $sessions_table ) );
		if ( $table_exists ) {
			$count = $wpdb->get_var( $wpdb->prepare( "
				SELECT COUNT(DISTINCT DATE(created_at))
				FROM {$sessions_table}
				WHERE user_id = %d
			", $user_id ) );
			
			return intval( $count ) ?: 1;
		}
		
		// Default: assume at least 1 login
		return 1;
	}

	/**
	 * Get wizard badges based on course categories
	 *
	 * @param int $user_id User ID
	 * @param array $completed_course_ids Completed course IDs
	 * @return array Wizard badges
	 */
	private function get_wizard_badges( $user_id, $completed_course_ids ) {
		// Define wizard badge categories
		$wizard_categories = array(
			array(
				'id' => 1,
				'title' => 'Seed Wizard',
				'description' => 'Completed 3 courses on Sustainable Food Security',
				'icon' => 'Trophy',
				'color' => 'bg-yellow-500',
				'category_slug' => 'sustainable-food-security',
				'required_courses' => 3,
			),
			array(
				'id' => 2,
				'title' => 'Builder Wizard',
				'description' => 'Completed 3 courses on Community Strengthening',
				'icon' => 'Wrench',
				'color' => 'bg-purple-400',
				'category_slug' => 'community-strengthening',
				'required_courses' => 3,
			),
			array(
				'id' => 3,
				'title' => 'Earth Wizard',
				'description' => 'Completed 3 courses on Climate Resilience',
				'icon' => 'Globe',
				'color' => 'bg-blue-600',
				'category_slug' => 'climate-resilience',
				'required_courses' => 3,
			),
			array(
				'id' => 4,
				'title' => 'Youth Wizard',
				'description' => 'Completed 3 courses on Early Childhood Development',
				'icon' => 'Users',
				'color' => 'bg-cyan-400',
				'category_slug' => 'early-childhood-development',
				'required_courses' => 3,
			),
			array(
				'id' => 5,
				'title' => 'Knowledge Wizard',
				'description' => 'Completed 3 courses on Education',
				'icon' => 'BookOpen',
				'color' => 'bg-orange-500',
				'category_slug' => 'education',
				'required_courses' => 3,
			),
			array(
				'id' => 6,
				'title' => 'Life Wizard',
				'description' => 'Completed 3 courses on Health and Nutrition',
				'icon' => 'Heart',
				'color' => 'bg-pink-600',
				'category_slug' => 'health-nutrition',
				'required_courses' => 3,
			),
		);

		$badges = array();
		
		foreach ( $wizard_categories as $wizard ) {
			// Count completed courses in this category
			$completed_in_category = 0;
			
			if ( ! empty( $completed_course_ids ) ) {
				foreach ( $completed_course_ids as $course_id ) {
					// Check if course belongs to this category
					$categories = wp_get_post_terms( $course_id, 'ld_course_category', array( 'fields' => 'slugs' ) );
					
					if ( ! is_wp_error( $categories ) && in_array( $wizard['category_slug'], $categories ) ) {
						$completed_in_category++;
					}
				}
			}
			
			$badges[] = array(
				'id' => $wizard['id'],
				'title' => $wizard['title'],
				'description' => $wizard['description'],
				'icon' => $wizard['icon'],
				'color' => $wizard['color'],
				'progress' => $completed_in_category,
				'required' => $wizard['required_courses'],
				'unlocked' => $completed_in_category >= $wizard['required_courses'],
			);
		}
		
		return $badges;
	}

	/**
	 * Get user achievements
	 *
	 * @param int $user_id User ID
	 * @param array $completed_courses Completed courses with dates
	 * @param int $login_count User login count
	 * @return array Achievements
	 */
	private function get_user_achievements( $user_id, $completed_courses, $login_count ) {
		$achievements = array();
		$achievement_id = 1;

		// Sort completed courses by date (newest first)
		usort( $completed_courses, function( $a, $b ) {
			return intval( $b['completed_date'] ) - intval( $a['completed_date'] );
		} );

		// Achievement: First Course Completed
		if ( count( $completed_courses ) >= 1 ) {
			$first_course = end( $completed_courses ); // Oldest completion
			$achievements[] = array(
				'id' => $achievement_id++,
				'title' => 'First Course Completed',
				'description' => 'Completed your first course successfully',
				'date' => date( 'Y-m-d', intval( $first_course['completed_date'] ) ),
				'icon' => 'Trophy',
				'color' => 'bg-blue-600',
				'category' => 'Milestone',
				'categoryColor' => 'bg-blue-100 text-blue-700',
			);
		}

		// Achievement: Quick Learner (completed a course within 2 weeks of enrollment)
		// For now, we'll check if any course was completed
		if ( count( $completed_courses ) >= 1 ) {
			$recent_course = reset( $completed_courses ); // Most recent completion
			$achievements[] = array(
				'id' => $achievement_id++,
				'title' => 'Quick Learner',
				'description' => 'Completed a course efficiently',
				'date' => date( 'Y-m-d', intval( $recent_course['completed_date'] ) ),
				'icon' => 'Zap',
				'color' => 'bg-cyan-400',
				'category' => 'Speed',
				'categoryColor' => 'bg-cyan-100 text-cyan-700',
			);
		}

		// Achievement: High Achiever (completed 3+ courses)
		if ( count( $completed_courses ) >= 3 ) {
			$third_course = $completed_courses[2];
			$achievements[] = array(
				'id' => $achievement_id++,
				'title' => 'High Achiever',
				'description' => 'Completed 3 or more courses',
				'date' => date( 'Y-m-d', intval( $third_course['completed_date'] ) ),
				'icon' => 'Star',
				'color' => 'bg-orange-500',
				'category' => 'Performance',
				'categoryColor' => 'bg-orange-100 text-orange-700',
			);
		}

		// Achievement: Consistent Learner (30+ logins)
		if ( $login_count >= 30 ) {
			$achievements[] = array(
				'id' => $achievement_id++,
				'title' => 'Consistent Learner',
				'description' => 'Logged in for 30 or more days',
				'date' => date( 'Y-m-d' ), // Current date as we don't track when this was achieved
				'icon' => 'Calendar',
				'color' => 'bg-pink-600',
				'category' => 'Consistency',
				'categoryColor' => 'bg-pink-100 text-pink-700',
			);
		}

		// Achievement: Course Master (5+ courses)
		if ( count( $completed_courses ) >= 5 ) {
			$fifth_course = $completed_courses[4];
			$achievements[] = array(
				'id' => $achievement_id++,
				'title' => 'Course Master',
				'description' => 'Completed 5 or more courses',
				'date' => date( 'Y-m-d', intval( $fifth_course['completed_date'] ) ),
				'icon' => 'Award',
				'color' => 'bg-yellow-500',
				'category' => 'Milestone',
				'categoryColor' => 'bg-yellow-100 text-yellow-700',
			);
		}

		// Achievement: Expert (10+ courses)
		if ( count( $completed_courses ) >= 10 ) {
			$tenth_course = $completed_courses[9];
			$achievements[] = array(
				'id' => $achievement_id++,
				'title' => 'Expert',
				'description' => 'Completed 10 or more courses',
				'date' => date( 'Y-m-d', intval( $tenth_course['completed_date'] ) ),
				'icon' => 'GraduationCap',
				'color' => 'bg-green-600',
				'category' => 'Milestone',
				'categoryColor' => 'bg-green-100 text-green-700',
			);
		}

		// Sort achievements by date (newest first)
		usort( $achievements, function( $a, $b ) {
			return strtotime( $b['date'] ) - strtotime( $a['date'] );
		} );

		return $achievements;
	}

	/**
	 * Get learner certificates
	 * Returns all certificates earned by the learner
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response
	 */
	public function get_learner_certificates( WP_REST_Request $request ) {
		global $wpdb;

		try {
			// Get current authenticated user
			$user = get_current_auth_user();

			if ( ! $user || ! isset( $user->ID ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}

			$user_id = intval( $user->ID );

			// Get certificates from LearnDash
			$certificates = $this->get_user_certificates( $user_id );

			return new WP_REST_Response( array(
				'success' => true,
				'data' => array(
					'certificates' => $certificates,
					'total' => count( $certificates ),
				),
			), 200 );

		} catch ( Exception $e ) {
			error_log( 'Learner Certificates API Error: ' . $e->getMessage() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching certificates.',
				'details' => $e->getMessage(),
			), 500 );
		}
	}

	/**
	 * Get single certificate details
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response
	 */
	public function get_certificate_details( WP_REST_Request $request ) {
		global $wpdb;

		try {
			$user = get_current_auth_user();

			if ( ! $user || ! isset( $user->ID ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}

			$user_id = intval( $user->ID );
			$certificate_id = intval( $request->get_param( 'certificate_id' ) );

			// Get the certificate
			$certificate = $this->get_single_certificate( $user_id, $certificate_id );

			if ( ! $certificate ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Certificate not found or access denied.',
				), 404 );
			}

			return new WP_REST_Response( array(
				'success' => true,
				'data' => $certificate,
			), 200 );

		} catch ( Exception $e ) {
			error_log( 'Certificate Details API Error: ' . $e->getMessage() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching certificate details.',
			), 500 );
		}
	}

	/**
	 * View certificate
	 * Returns a signed URL that allows viewing the certificate
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response
	 */
	public function view_certificate( WP_REST_Request $request ) {
		try {
			$user = get_current_auth_user();

			if ( ! $user || ! isset( $user->ID ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}

			$user_id = intval( $user->ID );
			$certificate_id_param = $request->get_param( 'certificate_id' );

			// Parse composite ID (format: certificateTemplateId_courseId)
			$course_id = $this->parse_certificate_course_id( $certificate_id_param );

			if ( ! $course_id ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Invalid certificate ID format.',
				), 400 );
			}

			// Verify user completed this course
			$certificate = $this->get_single_certificate( $user_id, $certificate_id_param );

			if ( ! $certificate ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Certificate not found or access denied.',
				), 404 );
			}

			// Get the certificate template ID
			$cert_template_id = $this->get_course_certificate_id( $course_id );
			
			if ( ! $cert_template_id ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No certificate template found for this course.',
				), 404 );
			}

			// Generate a signed access token
			$access_token = $this->generate_certificate_access_token( $user_id, $course_id, $cert_template_id );

			// Build the certificate URL with the signed token
			$cert_url = add_query_arg( array(
				'course_id' => $course_id,
				'cert_token' => $access_token,
			), get_permalink( $cert_template_id ) );

			return new WP_REST_Response( array(
				'success' => true,
				'data' => array(
					'certificate_url' => $cert_url,
					'title' => $certificate['title'],
				),
			), 200 );

		} catch ( Exception $e ) {
			error_log( 'Certificate View API Error: ' . $e->getMessage() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while generating certificate link.',
			), 500 );
		}
	}

	/**
	 * Generate a signed certificate access token
	 * This creates a temporary token that allows certificate access without WordPress login
	 *
	 * @param int $user_id User ID
	 * @param int $course_id Course ID
	 * @param int $cert_template_id Certificate template ID
	 * @return string Signed token
	 */
	private function generate_certificate_access_token( $user_id, $course_id, $cert_template_id ) {
		// Create a token that expires in 5 minutes
		$expiry = time() + 300;
		$data = $user_id . '|' . $course_id . '|' . $cert_template_id . '|' . $expiry;
		$signature = hash_hmac( 'sha256', $data, wp_salt( 'auth' ) );
		
		return base64_encode( $data . '|' . $signature );
	}

	/**
	 * Verify a signed certificate access token
	 *
	 * @param string $token The token to verify
	 * @return array|false Array with user_id, course_id, cert_template_id or false if invalid
	 */
	private function verify_certificate_access_token( $token ) {
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
			return false;
		}

		// Verify signature
		$data = $user_id . '|' . $course_id . '|' . $cert_template_id . '|' . $expiry;
		$expected_signature = hash_hmac( 'sha256', $data, wp_salt( 'auth' ) );

		if ( ! hash_equals( $expected_signature, $signature ) ) {
			return false;
		}

		return array(
			'user_id' => intval( $user_id ),
			'course_id' => intval( $course_id ),
			'cert_template_id' => intval( $cert_template_id ),
		);
	}

	/**
	 * Download certificate
	 * Returns a signed URL for downloading the certificate PDF
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response
	 */
	public function download_certificate( WP_REST_Request $request ) {
		try {
			$user = get_current_auth_user();

			if ( ! $user || ! isset( $user->ID ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}

			$user_id = intval( $user->ID );
			$certificate_id_param = $request->get_param( 'certificate_id' );

			// Parse composite ID (format: certificateTemplateId_courseId)
			$course_id = $this->parse_certificate_course_id( $certificate_id_param );

			if ( ! $course_id ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Invalid certificate ID format.',
				), 400 );
			}

			// Verify user completed this course
			$certificate = $this->get_single_certificate( $user_id, $certificate_id_param );

			if ( ! $certificate ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'Certificate not found or access denied.',
				), 404 );
			}

			// Get the certificate template ID
			$cert_template_id = $this->get_course_certificate_id( $course_id );
			
			if ( ! $cert_template_id ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'No certificate template found for this course.',
				), 404 );
			}

			// Generate a signed access token
			$access_token = $this->generate_certificate_access_token( $user_id, $course_id, $cert_template_id );

			// Build the certificate download URL with the signed token and pdf parameter
			$download_url = add_query_arg( array(
				'course_id' => $course_id,
				'cert_token' => $access_token,
				'pdf' => 1,
			), get_permalink( $cert_template_id ) );

			return new WP_REST_Response( array(
				'success' => true,
				'data' => array(
					'download_url' => $download_url,
					'filename' => sanitize_file_name( $certificate['title'] . '-certificate.pdf' ),
				),
			), 200 );

		} catch ( Exception $e ) {
			error_log( 'Certificate Download API Error: ' . $e->getMessage() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while generating download link.',
			), 500 );
		}
	}

	/**
	 * Get all certificates for a user
	 *
	 * @param int $user_id User ID
	 * @return array Certificates
	 */
	private function get_user_certificates( $user_id ) {
		global $wpdb;

		$certificates = array();
		$activity_table = $wpdb->prefix . 'learndash_user_activity';

		// Get completed courses
		$completed_courses = $wpdb->get_results( $wpdb->prepare( "
			SELECT post_id, activity_completed
			FROM {$activity_table}
			WHERE user_id = %d
			AND activity_type = 'course'
			AND activity_status = 1
			AND activity_completed IS NOT NULL
			AND activity_completed != ''
			AND activity_completed != '0'
			ORDER BY activity_completed DESC
		", $user_id ) );

		if ( empty( $completed_courses ) ) {
			return $certificates;
		}

		// Color palette for certificates
		$colors = array(
			'bg-yellow-500',
			'bg-purple-500',
			'bg-blue-600',
			'bg-green-500',
			'bg-pink-500',
			'bg-orange-500',
			'bg-cyan-500',
			'bg-red-500',
		);

		$cert_index = 0;

		foreach ( $completed_courses as $course_data ) {
			$course_id = intval( $course_data->post_id );
			$course = get_post( $course_id );

			if ( ! $course || $course->post_status !== 'publish' ) {
				continue;
			}

			// Check if course has a certificate
			$certificate_id = $this->get_course_certificate_id( $course_id );
			
			if ( ! $certificate_id ) {
				// Course doesn't have a certificate template, skip
				continue;
			}

			// Get course instructor
			$instructor_name = $this->get_course_instructor( $course_id );

			// Get quiz score for this course (if any)
			$quiz_score = $this->get_course_quiz_score( $user_id, $course_id );

			// Generate certificate ID
			$cert_code = strtoupper( substr( preg_replace( '/[^a-zA-Z]/', '', $course->post_title ), 0, 2 ) );
			$cert_year = date( 'Y', intval( $course_data->activity_completed ) );
			$certificate_code = $cert_code . '-' . $cert_year . '-' . str_pad( $course_id, 3, '0', STR_PAD_LEFT );

			$certificates[] = array(
				'id' => $certificate_id . '_' . $course_id, // Unique ID combining certificate template and course
				'certificate_id' => $certificate_id,
				'course_id' => $course_id,
				'title' => $course->post_title,
				'certificate_code' => 'Certificate ID: ' . $certificate_code,
				'instructor' => $instructor_name,
				'score' => $quiz_score ? $quiz_score . '%' : 'N/A',
				'issue_date' => date( 'Y-m-d', intval( $course_data->activity_completed ) ),
				'color' => $colors[ $cert_index % count( $colors ) ],
				'view_url' => $this->get_certificate_view_url( $user_id, $certificate_id, $course_id ),
				'download_url' => $this->get_certificate_download_url( $user_id, $certificate_id, $course_id ),
			);

			$cert_index++;
		}

		return $certificates;
	}

	/**
	 * Get single certificate by ID
	 *
	 * @param int $user_id User ID
	 * @param int $certificate_id Certificate ID (format: certificateTemplateId_courseId)
	 * @return array|null Certificate data or null
	 */
	private function get_single_certificate( $user_id, $certificate_id ) {
		// Parse the certificate ID
		$parts = explode( '_', $certificate_id );
		
		if ( count( $parts ) !== 2 ) {
			// Try to find by course ID
			$certificates = $this->get_user_certificates( $user_id );
			foreach ( $certificates as $cert ) {
				if ( $cert['course_id'] == $certificate_id || $cert['certificate_id'] == $certificate_id ) {
					return $cert;
				}
			}
			return null;
		}

		$cert_template_id = intval( $parts[0] );
		$course_id = intval( $parts[1] );

		// Verify user completed this course
		global $wpdb;
		$activity_table = $wpdb->prefix . 'learndash_user_activity';

		$completion = $wpdb->get_row( $wpdb->prepare( "
			SELECT activity_completed
			FROM {$activity_table}
			WHERE user_id = %d
			AND post_id = %d
			AND activity_type = 'course'
			AND activity_status = 1
		", $user_id, $course_id ) );

		if ( ! $completion ) {
			return null;
		}

		$course = get_post( $course_id );
		if ( ! $course ) {
			return null;
		}

		$instructor_name = $this->get_course_instructor( $course_id );
		$quiz_score = $this->get_course_quiz_score( $user_id, $course_id );

		$cert_code = strtoupper( substr( preg_replace( '/[^a-zA-Z]/', '', $course->post_title ), 0, 2 ) );
		$cert_year = date( 'Y', intval( $completion->activity_completed ) );
		$certificate_code = $cert_code . '-' . $cert_year . '-' . str_pad( $course_id, 3, '0', STR_PAD_LEFT );

		return array(
			'id' => $certificate_id,
			'certificate_id' => $cert_template_id,
			'course_id' => $course_id,
			'title' => $course->post_title,
			'certificate_code' => 'Certificate ID: ' . $certificate_code,
			'instructor' => $instructor_name,
			'score' => $quiz_score ? $quiz_score . '%' : 'N/A',
			'issue_date' => date( 'Y-m-d', intval( $completion->activity_completed ) ),
			'view_url' => $this->get_certificate_view_url( $user_id, $cert_template_id, $course_id ),
			'download_url' => $this->get_certificate_download_url( $user_id, $cert_template_id, $course_id ),
		);
	}

	/**
	 * Get course certificate template ID
	 *
	 * @param int $course_id Course ID
	 * @return int|null Certificate ID or null
	 */
	private function get_course_certificate_id( $course_id ) {
		// LearnDash stores certificate in course meta
		$certificate_id = get_post_meta( $course_id, '_ld_certificate', true );
		
		if ( ! empty( $certificate_id ) ) {
			return intval( $certificate_id );
		}

		// Try alternative meta key
		$course_settings = get_post_meta( $course_id, '_sfwd-courses', true );
		if ( is_array( $course_settings ) && ! empty( $course_settings['sfwd-courses_certificate'] ) ) {
			return intval( $course_settings['sfwd-courses_certificate'] );
		}

		return null;
	}

	/**
	 * Get course instructor name
	 *
	 * @param int $course_id Course ID
	 * @return string Instructor name
	 */
	private function get_course_instructor( $course_id ) {
		$course = get_post( $course_id );
		
		if ( ! $course ) {
			return 'Unknown Instructor';
		}

		// Get course author
		$author = get_user_by( 'id', $course->post_author );
		
		if ( $author ) {
			return $author->display_name;
		}

		return 'Unknown Instructor';
	}

	/**
	 * Get quiz score for a course
	 *
	 * @param int $user_id User ID
	 * @param int $course_id Course ID
	 * @return int|null Quiz score percentage or null
	 */
	private function get_course_quiz_score( $user_id, $course_id ) {
		global $wpdb;

		// Get quiz results from LearnDash
		$quiz_table = $wpdb->prefix . 'learndash_user_activity';

		$quiz_result = $wpdb->get_var( $wpdb->prepare( "
			SELECT AVG(
				CASE 
					WHEN activity_meta LIKE '%%percentage%%' THEN 
						CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(activity_meta, 'percentage\";i:', -1), ';', 1) AS UNSIGNED)
					ELSE NULL
				END
			) as avg_score
			FROM {$quiz_table}
			WHERE user_id = %d
			AND activity_type = 'quiz'
			AND course_id = %d
			AND activity_status = 1
		", $user_id, $course_id ) );

		if ( $quiz_result ) {
			return round( floatval( $quiz_result ) );
		}

		// Alternative: Check user quiz meta
		$quiz_progress = get_user_meta( $user_id, '_sfwd-quizzes', true );
		
		if ( is_array( $quiz_progress ) ) {
			$course_quizzes = array();
			
			foreach ( $quiz_progress as $quiz ) {
				if ( isset( $quiz['course'] ) && $quiz['course'] == $course_id && isset( $quiz['percentage'] ) ) {
					$course_quizzes[] = floatval( $quiz['percentage'] );
				}
			}
			
			if ( ! empty( $course_quizzes ) ) {
				return round( array_sum( $course_quizzes ) / count( $course_quizzes ) );
			}
		}

		return null;
	}

	/**
	 * Parse certificate ID to extract course ID
	 * Supports both numeric course ID and composite ID (certificateTemplateId_courseId)
	 *
	 * @param string|int $certificate_id Certificate ID parameter
	 * @return int|null Course ID or null if invalid
	 */
	private function parse_certificate_course_id( $certificate_id ) {
		// Check if it's a composite ID (format: certificateTemplateId_courseId)
		if ( strpos( $certificate_id, '_' ) !== false ) {
			$parts = explode( '_', $certificate_id );
			if ( count( $parts ) === 2 && is_numeric( $parts[1] ) ) {
				return intval( $parts[1] );
			}
		}

		// If it's just a numeric ID, try to find the course
		if ( is_numeric( $certificate_id ) ) {
			return intval( $certificate_id );
		}

		return null;
	}

	/**
	 * Get certificate view URL
	 * Uses the API endpoint to serve certificates with proper authentication
	 *
	 * @param int $user_id User ID
	 * @param int $certificate_id Certificate template ID
	 * @param int $course_id Course ID
	 * @return string View URL
	 */
	private function get_certificate_view_url( $user_id, $certificate_id, $course_id ) {
		// Return API endpoint URL for viewing certificate
		// This will be handled by the view_certificate endpoint
		return rest_url( $this->namespace . '/learner-certificates/' . $certificate_id . '_' . $course_id . '/view' );
	}

	/**
	 * Get certificate download URL
	 * Uses the API endpoint to serve certificate PDFs with proper authentication
	 *
	 * @param int $user_id User ID
	 * @param int $certificate_id Certificate template ID
	 * @param int $course_id Course ID
	 * @return string Download URL
	 */
	private function get_certificate_download_url( $user_id, $certificate_id, $course_id ) {
		// Return API endpoint URL for downloading certificate
		return rest_url( $this->namespace . '/learner-certificates/' . $certificate_id . '_' . $course_id . '/download' );
	}

	/**
	 * Generate LearnDash certificate link
	 * Creates a certificate URL that bypasses nonce validation for API users
	 *
	 * @param int $user_id User ID
	 * @param int $course_id Course ID
	 * @param bool $pdf Whether to generate PDF download link
	 * @return string Certificate URL
	 */
	private function generate_certificate_link_for_user( $user_id, $course_id, $pdf = false ) {
		$cert_link = '';

		try {
			$certificate_id = $this->get_course_certificate_id( $course_id );
			
			if ( ! $certificate_id ) {
				error_log( 'No certificate template found for course: ' . $course_id );
				return '';
			}

			$certificate_post = get_post( $certificate_id );
			if ( ! $certificate_post ) {
				error_log( 'Certificate post not found: ' . $certificate_id );
				return '';
			}

			// Build the certificate URL with required parameters
			// Include user parameter so the plugin can set user context
			$args = array(
				'course_id' => $course_id,
				'user' => $user_id,
			);

			if ( $pdf ) {
				$args['pdf'] = 1;
			}

			$cert_link = add_query_arg( $args, get_permalink( $certificate_id ) );

			// Log for debugging
			error_log( 'Generated certificate link: ' . $cert_link . ' for user: ' . $user_id );

		} catch ( Exception $e ) {
			error_log( 'Generate certificate link error: ' . $e->getMessage() );
		}

		return $cert_link;
	}

	/**
	 * Get learner settings
	 * Returns personal info, learning preferences, and notification settings
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response
	 */
	public function get_learner_settings( WP_REST_Request $request ) {
		try {
			$user = get_current_auth_user();

			if ( ! $user || ! isset( $user->ID ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}

			$user_id = intval( $user->ID );
			$user_data = get_userdata( $user_id );

			if ( ! $user_data ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not found.',
				), 404 );
			}

			// Get user meta for settings
			$phone = get_user_meta( $user_id, 'phone', true );
			$department = get_user_meta( $user_id, 'department', true );
			$preferred_language = get_user_meta( $user_id, 'preferred_language', true );
			$learning_goal = get_user_meta( $user_id, 'learning_goal', true );
			$course_reminders = get_user_meta( $user_id, 'notification_course_reminders', true );
			$achievement_notifications = get_user_meta( $user_id, 'notification_achievements', true );
			$weekly_report = get_user_meta( $user_id, 'notification_weekly_report', true );

			// Build settings response
			$settings = array(
				'personal_info' => array(
					'full_name' => $user_data->display_name,
					'first_name' => $user_data->first_name,
					'last_name' => $user_data->last_name,
					'email' => $user_data->user_email,
					'phone' => $phone ?: '',
					'department' => $department ?: '',
					'avatar_url' => get_avatar_url( $user_id, array( 'size' => 150 ) ),
				),
				'learning_preferences' => array(
					'preferred_language' => $preferred_language ?: 'english',
					'learning_goal' => $learning_goal ?: 'skill',
				),
				'notifications' => array(
					'course_reminders' => $course_reminders !== 'false' && $course_reminders !== '0',
					'achievement_notifications' => $achievement_notifications !== 'false' && $achievement_notifications !== '0',
					'weekly_report' => $weekly_report === 'true' || $weekly_report === '1',
				),
				'available_options' => array(
					'departments' => array(
						array( 'value' => 'it', 'label' => 'IT' ),
						array( 'value' => 'hr', 'label' => 'HR' ),
						array( 'value' => 'finance', 'label' => 'Finance' ),
						array( 'value' => 'marketing', 'label' => 'Marketing' ),
						array( 'value' => 'operations', 'label' => 'Operations' ),
						array( 'value' => 'education', 'label' => 'Education' ),
						array( 'value' => 'health', 'label' => 'Health' ),
						array( 'value' => 'other', 'label' => 'Other' ),
					),
					'languages' => array(
						array( 'value' => 'english', 'label' => 'English' ),
						array( 'value' => 'urdu', 'label' => 'Urdu' ),
						array( 'value' => 'arabic', 'label' => 'Arabic' ),
						array( 'value' => 'french', 'label' => 'French' ),
						array( 'value' => 'spanish', 'label' => 'Spanish' ),
					),
					'learning_goals' => array(
						array( 'value' => 'skill', 'label' => 'Skill Development' ),
						array( 'value' => 'career', 'label' => 'Career Advancement' ),
						array( 'value' => 'certification', 'label' => 'Certification' ),
						array( 'value' => 'personal', 'label' => 'Personal Growth' ),
					),
				),
			);

			return new WP_REST_Response( array(
				'success' => true,
				'data' => $settings,
			), 200 );

		} catch ( Exception $e ) {
			error_log( 'Learner Settings GET API Error: ' . $e->getMessage() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while fetching settings.',
			), 500 );
		}
	}

	/**
	 * Update learner settings
	 *
	 * @param WP_REST_Request $request Request object
	 * @return WP_REST_Response
	 */
	public function update_learner_settings( WP_REST_Request $request ) {
		try {
			$user = get_current_auth_user();

			if ( ! $user || ! isset( $user->ID ) ) {
				return new WP_REST_Response( array(
					'success' => false,
					'message' => 'User not authenticated.',
				), 401 );
			}

			$user_id = intval( $user->ID );
			$params = $request->get_json_params();

			$updated_fields = array();

			// Update personal info
			if ( isset( $params['personal_info'] ) ) {
				$personal = $params['personal_info'];

				// Update display name
				if ( isset( $personal['full_name'] ) ) {
					wp_update_user( array(
						'ID' => $user_id,
						'display_name' => sanitize_text_field( $personal['full_name'] ),
					) );
					$updated_fields[] = 'full_name';
				}

				// Update first name
				if ( isset( $personal['first_name'] ) ) {
					wp_update_user( array(
						'ID' => $user_id,
						'first_name' => sanitize_text_field( $personal['first_name'] ),
					) );
					$updated_fields[] = 'first_name';
				}

				// Update last name
				if ( isset( $personal['last_name'] ) ) {
					wp_update_user( array(
						'ID' => $user_id,
						'last_name' => sanitize_text_field( $personal['last_name'] ),
					) );
					$updated_fields[] = 'last_name';
				}

				// Update email (with validation)
				if ( isset( $personal['email'] ) && is_email( $personal['email'] ) ) {
					$existing_user = get_user_by( 'email', $personal['email'] );
					if ( ! $existing_user || $existing_user->ID === $user_id ) {
						wp_update_user( array(
							'ID' => $user_id,
							'user_email' => sanitize_email( $personal['email'] ),
						) );
						$updated_fields[] = 'email';
					}
				}

				// Update phone
				if ( isset( $personal['phone'] ) ) {
					update_user_meta( $user_id, 'phone', sanitize_text_field( $personal['phone'] ) );
					$updated_fields[] = 'phone';
				}

				// Update department
				if ( isset( $personal['department'] ) ) {
					update_user_meta( $user_id, 'department', sanitize_text_field( $personal['department'] ) );
					$updated_fields[] = 'department';
				}
			}

			// Update learning preferences
			if ( isset( $params['learning_preferences'] ) ) {
				$prefs = $params['learning_preferences'];

				if ( isset( $prefs['preferred_language'] ) ) {
					update_user_meta( $user_id, 'preferred_language', sanitize_text_field( $prefs['preferred_language'] ) );
					$updated_fields[] = 'preferred_language';
				}

				if ( isset( $prefs['learning_goal'] ) ) {
					update_user_meta( $user_id, 'learning_goal', sanitize_text_field( $prefs['learning_goal'] ) );
					$updated_fields[] = 'learning_goal';
				}
			}

			// Update notification preferences
			if ( isset( $params['notifications'] ) ) {
				$notifications = $params['notifications'];

				if ( isset( $notifications['course_reminders'] ) ) {
					update_user_meta( $user_id, 'notification_course_reminders', $notifications['course_reminders'] ? 'true' : 'false' );
					$updated_fields[] = 'course_reminders';
				}

				if ( isset( $notifications['achievement_notifications'] ) ) {
					update_user_meta( $user_id, 'notification_achievements', $notifications['achievement_notifications'] ? 'true' : 'false' );
					$updated_fields[] = 'achievement_notifications';
				}

				if ( isset( $notifications['weekly_report'] ) ) {
					update_user_meta( $user_id, 'notification_weekly_report', $notifications['weekly_report'] ? 'true' : 'false' );
					$updated_fields[] = 'weekly_report';
				}
			}

			// Get updated settings to return
			$user_data = get_userdata( $user_id );
			
			$updated_settings = array(
				'personal_info' => array(
					'full_name' => $user_data->display_name,
					'first_name' => $user_data->first_name,
					'last_name' => $user_data->last_name,
					'email' => $user_data->user_email,
					'phone' => get_user_meta( $user_id, 'phone', true ) ?: '',
					'department' => get_user_meta( $user_id, 'department', true ) ?: '',
					'avatar_url' => get_avatar_url( $user_id, array( 'size' => 150 ) ),
				),
				'learning_preferences' => array(
					'preferred_language' => get_user_meta( $user_id, 'preferred_language', true ) ?: 'english',
					'learning_goal' => get_user_meta( $user_id, 'learning_goal', true ) ?: 'skill',
				),
				'notifications' => array(
					'course_reminders' => get_user_meta( $user_id, 'notification_course_reminders', true ) !== 'false',
					'achievement_notifications' => get_user_meta( $user_id, 'notification_achievements', true ) !== 'false',
					'weekly_report' => get_user_meta( $user_id, 'notification_weekly_report', true ) === 'true',
				),
			);

			return new WP_REST_Response( array(
				'success' => true,
				'message' => 'Settings updated successfully.',
				'updated_fields' => $updated_fields,
				'data' => $updated_settings,
			), 200 );

		} catch ( Exception $e ) {
			error_log( 'Learner Settings UPDATE API Error: ' . $e->getMessage() );
			return new WP_REST_Response( array(
				'success' => false,
				'message' => 'An error occurred while updating settings.',
			), 500 );
		}
	}
}

