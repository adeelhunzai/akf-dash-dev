<?php 
/**
 * Register/enqueue custom scripts and styles
 */
add_action( 'wp_enqueue_scripts', function() {
	// Enqueue your files on the canvas & frontend, not the builder panel. Otherwise custom CSS might affect builder)
	if ( ! bricks_is_builder_main() ) {
		wp_enqueue_style( 'bricks-child', get_stylesheet_uri(), ['bricks-frontend'], filemtime( get_stylesheet_directory() . '/style.css' ) );
	}
} );

/**
 * Register custom elements
 */
add_action( 'init', function() {
  $element_files = [
    __DIR__ . '/elements/title.php',
  ];

  foreach ( $element_files as $file ) {
    \Bricks\Elements::register_element( $file );
  }
}, 11 );

/**
 * Add text strings to builder
 */
add_filter( 'bricks/builder/i18n', function( $i18n ) {
  // For element category 'custom'
  $i18n['custom'] = esc_html__( 'Custom', 'bricks' );

  return $i18n;
} );

add_filter( 'bricks/code/echo_function_names', function() {
  return [
    'get_post_type',
    'mb_get_post_type_label',
    'mb_cpt_cta',
    'main_sdg',
    'mb_count_sdg',
    'mb_theme_slug',
    'get_vimeo_videos_data',
    'add_learndash_course_status_body_class',
    'add_user_role_body_class',
	'get_avatar_url',
	 'mb_get_term_slug',
	  'get_acf_oembed_url',
	  'mb_lang_slug',
	  'mb_have_rows',
	  'mb_get_language_term_slug',
'get_learndash_course_name',
	  'mb_display_current_user_last_active_course_and_step',
  ];
} );

/**/
function prefix_register_script( $scripts ) {

	$scripts[] = [
		'handle'  => 'my-script',
		'source'  => '/wp-content/themes/foundation/custom-filter.js',
		'version' => '1.0.11',
	];

	return $scripts;

}

add_filter( 'wp_grid_builder/frontend/register_scripts', 'prefix_register_script' );
add_filter( 'ld_focus_mode_welcome_name', function( $display_name, $user_info ) {
if ( $user_info->first_name ) {

return $user_info->first_name;
}

return $user_info->display_name;
}, 20, 2);


add_action('rest_api_init', function() {
    register_rest_route('wp/v2', '/users/by-roles', [
        'methods' => 'GET',
        'callback' => 'get_users_by_roles',
        'permission_callback' => 'is_admin_user', // Restrict access to admin
    ]);
});

function get_users_by_roles(WP_REST_Request $request) {
    // Get the role parameter from the URL query string
    $role_to_fetch = $request->get_param('role'); // Get the role from query string

    // If no role is provided, include the Subscriber role in the default set of roles
    if (!$role_to_fetch) {
        $roles_to_fetch = ['administrator', 'akdn', 'manager', 'facilitator', 'subscriber']; // Explicitly include 'subscriber'
    } elseif ($role_to_fetch === 'all') {
        // If the role is 'all', fetch all users regardless of role
        $roles_to_fetch = [];
    } else {
        // If a specific role is passed, query users with that role
        $roles_to_fetch = [$role_to_fetch];  // Query specific role
    }

    // Log role to fetch for debugging purposes
    error_log('Roles to fetch: ' . implode(', ', $roles_to_fetch));

    // Query users with the specified roles
    $args = [
        'role__in' => $roles_to_fetch,  // Fetch users who have any of these roles
        'orderby' => 'ID',
        'order' => 'ASC',
        'fields' => ['ID', 'user_login', 'user_email', 'roles'],  // Specify fields you want to retrieve
    ];

    // Fetch users
    $user_query = new WP_User_Query($args);

    // Check if users are found
    if (empty($user_query->get_results())) {
        return new WP_REST_Response('No users found with the specified role(s).', 404);
    }

    // Return users in the API response
    $users = [];
    foreach ($user_query->get_results() as $user) {
        $user_data = get_userdata($user->ID); // Fetch user data to ensure roles are included
        $users[] = [
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'roles' => $user_data->roles, // Ensure roles are returned
        ];
    }

    return new WP_REST_Response($users, 200);
}


// Register the custom REST API route
add_action('rest_api_init', function () {
    register_rest_route('custom-api/v1', '/users-count', [
        'methods' => 'GET',
        'callback' => 'get_all_users_count_roles_period_and_active_stats',
        'permission_callback' => '__return_true',
        'args' => [
            'period' => [
                'required' => false,
                'validate_callback' => function($param) {
                    return in_array($param, ['1month', '3months', '6months', '1year']);
                }
            ]
        ]
    ]);
});

function get_all_users_count_roles_period_and_active_stats(WP_REST_Request $request) {
    global $wpdb;

    $period = $request->get_param('period');
    $date_query = null;

    // Handle date filtering for user registration
    if ($period) {
        $current_date = current_time('Y-m-d H:i:s');
        switch ($period) {
            case '1month':
                $date_query = date('Y-m-d H:i:s', strtotime('-1 month', strtotime($current_date)));
                break;
            case '3months':
                $date_query = date('Y-m-d H:i:s', strtotime('-3 months', strtotime($current_date)));
                break;
            case '6months':
                $date_query = date('Y-m-d H:i:s', strtotime('-6 months', strtotime($current_date)));
                break;
            case '1year':
                $date_query = date('Y-m-d H:i:s', strtotime('-1 year', strtotime($current_date)));
                break;
        }
    }

    $roles_to_count = ['group_leader', 'group_leader_clone', 'subscriber'];
    $response = [];

    // Total user count (all roles)
    $total_users = count_users();
    $response['total_users'] = $total_users['total_users'];

    // Total users for period (if specified)
    if ($period && $date_query) {
        $query = $wpdb->prepare("SELECT COUNT(ID) FROM $wpdb->users WHERE user_registered >= %s", $date_query);
        $response['total_users_for_period'] = (int) $wpdb->get_var($query);
        $response['period'] = $period;
    }

    // Count users by specific roles
    foreach ($roles_to_count as $role) {
        $args = [
            'role'   => $role,
            'fields' => 'ID',
        ];
        $user_query = new WP_User_Query($args);
        $response[$role] = $user_query->get_total();

        // Role count for given time period
        if ($period && $date_query) {
            $args['date_query'] = [
                [
                    'after' => $date_query,
                    'column' => 'user_registered',
                ]
            ];
            $user_query_period = new WP_User_Query($args);
            $response[$role . '_for_period'] = $user_query_period->get_total();
        }
    }

    // --- New Registrations (recent signups regardless of role) ---
    $current_date = current_time('Y-m-d H:i:s');
    $new_registrations_query = $wpdb->prepare("SELECT COUNT(ID) FROM $wpdb->users WHERE user_registered >= DATE_SUB(%s, INTERVAL 7 DAY)", $current_date);
    $response['new_registrations'] = (int) $wpdb->get_var($new_registrations_query);

    // --- Active Stats (merged from /active-stats) ---
    $response['active_courses'] = get_active_courses_count();
    $response['active_teams'] = get_active_teams_count();

    return new WP_REST_Response($response, 200);
}

// Get active course count
function get_active_courses_count() {
    $args = [
        'post_type'      => 'sfwd-courses',
        'post_status'    => 'publish',
        'fields'         => 'ids',
        'posts_per_page' => -1,
    ];
    return count(get_posts($args));
}

// Get active team (group) count
function get_active_teams_count() {
    $args = [
        'post_type'      => 'groups',
        'post_status'    => 'publish',
        'fields'         => 'ids',
        'posts_per_page' => -1,
    ];
    return count(get_posts($args));
}


// Register Course Completion Rate Endpoint
/**
 * Register REST API endpoint for LearnDash course completion rate (optimized + admin-only)
 */
add_action('rest_api_init', function () {
    if (!class_exists('SFWD_LMS')) {
        error_log('LearnDash not active, skipping course-completion-rate route');
        return;
    }

    register_rest_route('custom-api/v1', '/course-completion-rate', [
        'methods'             => 'GET',
        'callback'            => 'get_optimized_course_completion_rate',
        'permission_callback' => 'is_admin_user', // Admin only
    ]);
});

/**
 * Optimized callback for course completion rate
 */
function get_optimized_course_completion_rate(WP_REST_Request $request) {
    global $wpdb;

    try {
        // Validate LearnDash DB table exists
        $table = $wpdb->prefix . 'learndash_user_activity';
        $exists = $wpdb->get_var($wpdb->prepare(
            "SHOW TABLES LIKE %s",
            $table
        ));
        if (!$exists) {
            return new WP_REST_Response([
                'error' => true,
                'message' => 'LearnDash activity table not found.',
            ], 404);
        }

        // Get total published courses
        $total_courses = (int) $wpdb->get_var("
            SELECT COUNT(ID)
            FROM {$wpdb->posts}
            WHERE post_type = 'sfwd-courses'
              AND post_status = 'publish'
        ");

        // Count total course enrollments
        $total_enrolled = (int) $wpdb->get_var("
            SELECT COUNT(DISTINCT user_id)
            FROM {$table}
            WHERE activity_type = 'course'
        ");

        // Count completed courses
        $total_completed = (int) $wpdb->get_var("
            SELECT COUNT(DISTINCT user_id)
            FROM {$table}
            WHERE activity_type = 'course'
              AND activity_status = 1
        ");

        // Calculate in-progress and percentages
        $in_progress = max($total_enrolled - $total_completed, 0);
        $total_enrolled_safe = max($total_enrolled, 1);

        $completed_percentage = round(($total_completed / $total_enrolled_safe) * 100, 2);
        $in_progress_percentage = round(($in_progress / $total_enrolled_safe) * 100, 2);

        return new WP_REST_Response([
            'total_courses' => $total_courses,
            'total_enrolled' => $total_enrolled,
            'completed' => [
                'count' => $total_completed,
                'percentage' => $completed_percentage,
            ],
            'in_progress' => [
                'count' => $in_progress,
                'percentage' => $in_progress_percentage,
            ],
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'error' => true,
            'message' => 'Unexpected server error.',
            'details' => $e->getMessage(),
        ], 500);
    }
}


/**
 * Register REST API endpoint for Top Courses by enrollment count
 */
/**
/**
 * REST API: Top 5 Courses by Enrollments (Efficient + Real-Time)
 */
add_action('rest_api_init', function () {
    if (!class_exists('SFWD_LMS')) {
        error_log('LearnDash not active, skipping /top-courses route.');
        return;
    }

    register_rest_route('custom-api/v1', '/top-courses', [
        'methods'             => 'GET',
        'callback'            => 'get_top_5_courses_by_enrollment',
        'permission_callback' => 'is_admin_user', // Restrict to admin
    ]);
});

function get_top_5_courses_by_enrollment(WP_REST_Request $request) {
    global $wpdb;

    $table = $wpdb->prefix . 'learndash_user_activity';
    $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));

    if (!$exists) {
        return new WP_REST_Response([
            'error'   => true,
            'message' => 'LearnDash activity table not found.',
        ], 404);
    }

    // 🔹 Step 1: Aggregate enrollments for all courses
    $enrollments = $wpdb->get_results("
        SELECT post_id AS course_id, COUNT(DISTINCT user_id) AS enrollments
        FROM {$table}
        WHERE activity_type = 'course'
        GROUP BY post_id
        ORDER BY enrollments DESC
        LIMIT 5
    ", ARRAY_A);

    if (empty($enrollments)) {
        return new WP_REST_Response([
            'total_courses_found' => 0,
            'top_courses'         => [],
        ], 200);
    }

    // 🔹 Step 2: Get details of top 5 courses
    $top_courses = [];
    foreach ($enrollments as $row) {
        $course_id = intval($row['course_id']);

        // Skip invalid or unpublished
        if (get_post_status($course_id) !== 'publish') {
            continue;
        }

        $top_courses[] = [
            'id'          => $course_id,
            'title'       => get_the_title($course_id),
            'enrollments' => intval($row['enrollments']),
            'thumbnail'   => get_the_post_thumbnail_url($course_id, 'medium') ?: '',
            'link'        => get_permalink($course_id),
            'category'    => wp_get_post_terms($course_id, 'ld_course_category', ['fields' => 'names']),
            'modified'    => get_the_modified_date('Y-m-d H:i:s', $course_id),
        ];
    }

    // 🔹 Step 3: Return clean JSON
    return new WP_REST_Response([
        'total_courses_found' => count($top_courses),
        'top_courses'         => $top_courses,
    ], 200);
}



// User Management Table response
add_action('rest_api_init', function () {
    register_rest_route('custom-api/v1', '/users/list', [
        'methods' => 'GET',
        'callback' => 'get_users_with_details',
        'permission_callback' => '__return_true', // adjust if you want to restrict access
    ]);
});

function get_users_with_details(WP_REST_Request $request) {
    // Pagination setup
    $page = max(1, intval($request->get_param('page') ?: 1));
    $per_page = max(1, min(100, intval($request->get_param('per_page') ?: 5))); // Default 5, max 100

    // Get search and role filter parameters
    $search = sanitize_text_field($request->get_param('search') ?: '');
    $role_filter = sanitize_text_field($request->get_param('role') ?: '');

    // Build user query arguments
    $args = [
        'number' => $per_page,
        'paged'  => $page,
        'fields' => 'all',
    ];

    // Add search parameter if provided
    if (!empty($search)) {
        $args['search'] = '*' . $search . '*';
        $args['search_columns'] = ['user_login', 'user_email', 'display_name'];
    }

    // Add role filter if provided
    if (!empty($role_filter) && $role_filter !== 'all') {
        // Map frontend roles to WordPress roles
        $role_map = [
            'learner' => 'subscriber',
            'manager' => 'group_leader',
            'facilitator' => 'group_leader_clone',
        ];
        
        if (isset($role_map[$role_filter])) {
            $args['role'] = $role_map[$role_filter];
        }
    }

    // Fetch users
    $users = get_users($args);

    // Get total users count with same filters for pagination
    $count_args = [
        'fields' => 'ID',
    ];
    
    if (!empty($search)) {
        $count_args['search'] = '*' . $search . '*';
        $count_args['search_columns'] = ['user_login', 'user_email', 'display_name'];
    }
    
    if (!empty($role_filter) && $role_filter !== 'all' && isset($role_map[$role_filter])) {
        $count_args['role'] = $role_map[$role_filter];
    }
    
    $total_users_count = count(get_users($count_args));
    $total_pages = ceil($total_users_count / $per_page);

    $user_data = [];

    foreach ($users as $user) {
        // Get LearnDash teams (groups)
        $teams = learndash_get_users_group_ids($user->ID);
        $team_names = [];
        if (!empty($teams)) {
            foreach ($teams as $team_id) {
                $team_names[] = get_the_title($team_id);
            }
        }

        // Get number of enrolled courses
        $courses = learndash_user_get_enrolled_courses($user->ID, [], true);
        $course_count = is_array($courses) ? count($courses) : 0;

        // Get avatar URL
        $avatar_url = get_avatar_url($user->ID, ['size' => 96]);

        // Build user data object
        $user_data[] = [
            'ID'                => $user->ID,
            'user_login'        => $user->user_login,
            'user_email'        => $user->user_email,
            'display_name'      => $user->display_name,
            'roles'             => $user->roles,
            'avatar_url'        => $avatar_url,
            'teams'             => $team_names,
            'team_count'        => count($team_names),
            'courses_enrolled'  => $course_count,
        ];
    }

    // Final structured response
    $response = [
        'current_page' => $page,
        'per_page'     => $per_page,
        'total_pages'  => $total_pages,
        'total_users'  => $total_users_count,
        'users'        => $user_data,
    ];

    return new WP_REST_Response($response, 200);
}



// view users endpoint 


add_action('rest_api_init', function () {
    register_rest_route('custom-api/v1', '/users/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'get_user_details',
        'permission_callback' => '__return_true',
        'args' => [
            'id' => [
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ],
        ],
    ]);
});

function get_user_details($request) {
    $user_id = $request->get_param('id');
    
    // Get user data
    $user = get_userdata($user_id);
    
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
    }
    
    // Get LearnDash teams (groups)
    $teams = learndash_get_users_group_ids($user_id);
    $team_names = [];
    if (!empty($teams)) {
        foreach ($teams as $team_id) {
            $team_names[] = get_the_title($team_id);
        }
    }
    
    // Get enrolled courses
    $enrolled_courses = learndash_user_get_enrolled_courses($user_id, [], true);
    $total_courses = is_array($enrolled_courses) ? count($enrolled_courses) : 0;
    
    // Get completed courses
    $completed_courses = [];
    if (!empty($enrolled_courses)) {
        foreach ($enrolled_courses as $course_id) {
            if (learndash_course_completed($user_id, $course_id)) {
                $completed_courses[] = $course_id;
            }
        }
    }
    $completed_count = count($completed_courses);
    
    // Calculate completion rate
    $completion_rate = $total_courses > 0 ? round(($completed_count / $total_courses) * 100) : 0;
    
    // Get last login
    $last_login = get_user_meta($user_id, 'last_login', true);
    $last_login_date = $last_login ? date('Y-m-d', $last_login) : null;
    
    // Calculate days since last login
    $days_since_login = null;
    if ($last_login) {
        $days_since_login = floor((time() - $last_login) / (60 * 60 * 24));
    }
    
    // Get user registration date
    $registration_date = $user->user_registered;
    $days_since_registration = floor((time() - strtotime($registration_date)) / (60 * 60 * 24));
    
    // Get organization/department (custom meta field)
    $organization = get_user_meta($user_id, 'organization', true) ?: 'Not specified';
    
    // Get avatar URL
    $avatar_url = get_avatar_url($user_id, ['size' => 96]);
    
    // Determine account status (active if logged in within last 30 days)
    $account_status = ($days_since_login !== null && $days_since_login <= 30) ? 'Active' : 'Inactive';
    
    // Build response
    $response = [
        'ID' => $user->ID,
        'user_login' => $user->user_login,
        'user_email' => $user->user_email,
        'display_name' => $user->display_name,
        'roles' => $user->roles,
        'avatar_url' => $avatar_url,
        'organization' => $organization,
        'last_login' => $last_login_date,
        'days_since_login' => $days_since_login,
        'account_status' => $account_status,
        'days_since_registration' => $days_since_registration,
        'teams' => $team_names,
        'team_count' => count($team_names),
        'total_courses' => $total_courses,
        'completed_courses' => $completed_count,
        'completion_rate' => $completion_rate,
    ];
    
    return new WP_REST_Response($response, 200);
}

add_action('rest_api_init', function () {
    register_rest_route('custom-api/v1', '/users/(?P<id>\d+)', [
        'methods' => 'PUT',
        'callback' => 'update_user_details',
        'permission_callback' => 'is_admin_user',
        'args' => [
            'id' => [
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ],
        ],
    ]);
});

function update_user_details($request) {
    $user_id = $request->get_param('id');
    
    // Get user data
    $user = get_userdata($user_id);
    
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
    }
    
    // Get parameters from request body
    $params = $request->get_json_params();
    
    $display_name = isset($params['display_name']) ? sanitize_text_field($params['display_name']) : null;
    $email = isset($params['email']) ? sanitize_email($params['email']) : null;
    $role = isset($params['role']) ? sanitize_text_field($params['role']) : null;
    $organization = isset($params['organization']) ? sanitize_text_field($params['organization']) : null;
    
    // Prepare user data for update
    $user_data = ['ID' => $user_id];
    $updated_fields = [];
    
    // Update display name if provided
    if ($display_name !== null && $display_name !== '') {
        $user_data['display_name'] = $display_name;
        $updated_fields[] = 'display_name';
    }
    
    // Update email if provided and valid
    if ($email !== null && $email !== '') {
        // Check if email is already in use by another user
        $email_exists = email_exists($email);
        if ($email_exists && $email_exists != $user_id) {
            return new WP_Error(
                'email_exists',
                'This email is already registered to another user',
                ['status' => 400]
            );
        }
        
        if (!is_email($email)) {
            return new WP_Error(
                'invalid_email',
                'Invalid email address',
                ['status' => 400]
            );
        }
        
        $user_data['user_email'] = $email;
        $updated_fields[] = 'email';
    }
    
    // Update user data
    $result = wp_update_user($user_data);
    
    if (is_wp_error($result)) {
        return new WP_Error(
            'update_failed',
            'Failed to update user: ' . $result->get_error_message(),
            ['status' => 500]
        );
    }
    
    // Update role if provided
    if ($role !== null && $role !== '') {
        $valid_roles = ['subscriber', 'group_leader', 'group_leader_clone'];
        
        if (!in_array($role, $valid_roles)) {
            return new WP_Error(
                'invalid_role',
                'Invalid role specified',
                ['status' => 400]
            );
        }
        
        // Remove all existing roles and set the new one
        $user_obj = new WP_User($user_id);
        $user_obj->set_role($role);
        $updated_fields[] = 'role';
    }
    
    // Update organization (custom meta field) if provided
    if ($organization !== null) {
        update_user_meta($user_id, 'organization', $organization);
        $updated_fields[] = 'organization';
    }
    
    // Get updated user data
    $updated_user = get_userdata($user_id);
    $updated_organization = get_user_meta($user_id, 'organization', true);
    
    // Build response
    $response = [
        'success' => true,
        'message' => 'User updated successfully',
        'updated_fields' => $updated_fields,
        'user' => [
            'ID' => $updated_user->ID,
            'display_name' => $updated_user->display_name,
            'user_email' => $updated_user->user_email,
            'roles' => $updated_user->roles,
            'organization' => $updated_organization ?: 'Not specified',
        ],
    ];
    
    return new WP_REST_Response($response, 200);
}



/**
 * Delete User Endpoint for WordPress REST API
 * Add this code to your theme's functions.php file
 */

// Register the delete user endpoint
add_action('rest_api_init', function () {
    register_rest_route('custom-api/v1', '/users/(?P<id>\d+)', [
        'methods' => 'DELETE',
        'callback' => 'delete_user_account',
        'permission_callback' => 'is_admin_user',
        'args' => [
            'id' => [
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ],
        ],
    ]);
});

function delete_user_account($request) {
    $user_id = $request->get_param('id');
    
    // Get user data before deletion
    $user = get_userdata($user_id);
    
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
    }
    
    // Prevent deletion of current user
    $current_user_id = get_current_user_id();
    if ($user_id == $current_user_id) {
        return new WP_Error(
            'cannot_delete_self',
            'You cannot delete your own account',
            ['status' => 403]
        );
    }
    
    // Prevent deletion of super admin
    if (is_super_admin($user_id)) {
        return new WP_Error(
            'cannot_delete_admin',
            'Super administrators cannot be deleted',
            ['status' => 403]
        );
    }
    
    // Store user info for response
    $deleted_user_name = $user->display_name;
    $deleted_user_email = $user->user_email;
    
    // Include WordPress user functions
    require_once(ABSPATH . 'wp-admin/includes/user.php');
    
    // Delete the user
    // wp_delete_user() will reassign posts to current user or delete them
    // To delete all posts, use: wp_delete_user($user_id, null)
    // To reassign posts to another user: wp_delete_user($user_id, $reassign_user_id)
    $result = wp_delete_user($user_id);
    
    if (!$result) {
        return new WP_Error(
            'delete_failed',
            'Failed to delete user. Please try again.',
            ['status' => 500]
        );
    }
    
    // Build response
    $response = [
        'success' => true,
        'message' => 'User deleted successfully',
        'deleted_user_id' => $user_id,
        'deleted_user_name' => $deleted_user_name,
        'deleted_user_email' => $deleted_user_email,
    ];
    
    return new WP_REST_Response($response, 200);
}



/**
 * Get Teams (LearnDash Groups) Endpoint
 * Add this to your theme's functions.php
 */

add_action('rest_api_init', function () {
    register_rest_route('custom-api/v1', '/teams', [
        'methods' => 'GET',
        'callback' => 'get_teams_list',
        'permission_callback' => 'is_admin_user',
        'args' => [
            'page' => [
                'default' => 1,
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ],
            'per_page' => [
                'default' => 10,
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ],
            'search' => [
                'default' => '',
                'sanitize_callback' => 'sanitize_text_field'
            ],
            'status' => [
                'default' => 'all',
                'sanitize_callback' => 'sanitize_text_field'
            ],
        ],
    ]);
});

function get_teams_list($request) {
    $page = $request->get_param('page');
    $per_page = $request->get_param('per_page');
    $search = $request->get_param('search');
    $status_filter = $request->get_param('status');
    
    // Get all LearnDash groups
    $args = [
        'post_type' => 'groups',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'post_status' => 'publish',
        'orderby' => 'title',
        'order' => 'ASC',
    ];
    
    // Add search if provided
    if (!empty($search)) {
        $args['s'] = $search;
    }
    
    $query = new WP_Query($args);
    $teams = [];
    
    foreach ($query->posts as $group) {
        $group_id = $group->ID;
        
        // Get group users
        $group_users = learndash_get_groups_user_ids($group_id);
        $total_members = count($group_users);
        
        // Get group leaders (facilitators)
        $group_leaders = learndash_get_groups_administrator_ids($group_id);
        $facilitators_count = count($group_leaders);
        
        // Calculate progress based on team's associated course(s) completion
        $progress = 0;
        
        if ($total_members > 0) {
            // Get courses associated with this team (group) - try ALL possible methods
            $group_courses = [];
            
            // Method 1: Use LearnDash function (most common)
            if (function_exists('learndash_get_group_courses')) {
                $group_courses = learndash_get_group_courses($group_id);
                // Ensure it's an array
                if (!is_array($group_courses)) {
                    $group_courses = [];
                }
            }
            
            // Method 2: Try alternative LearnDash function
            if (empty($group_courses) && function_exists('learndash_group_enrolled_courses')) {
                $group_courses = learndash_group_enrolled_courses($group_id);
                if (!is_array($group_courses)) {
                    $group_courses = [];
                }
            }
            
            // Method 3: Get from post meta (LearnDash stores courses here)
            if (empty($group_courses)) {
                $course_ids = get_post_meta($group_id, 'learndash_group_enrolled_courses', true);
                if (is_array($course_ids) && !empty($course_ids)) {
                    $group_courses = $course_ids;
                } elseif (is_numeric($course_ids) && $course_ids > 0) {
                    // Sometimes it's stored as a single ID
                    $group_courses = [$course_ids];
                }
            }
            
            // Method 4: Check for individual course meta keys (from create_team fallback)
            if (empty($group_courses)) {
                global $wpdb;
                $meta_keys = $wpdb->get_col($wpdb->prepare(
                    "SELECT meta_key FROM {$wpdb->postmeta} 
                     WHERE post_id = %d 
                     AND meta_key LIKE 'learndash_group_enrolled_%%'",
                    $group_id
                ));
                
                foreach ($meta_keys as $meta_key) {
                    $course_id = str_replace('learndash_group_enrolled_', '', $meta_key);
                    if (is_numeric($course_id) && $course_id > 0) {
                        $group_courses[] = intval($course_id);
                    }
                }
            }
            
            // Method 5: Try other common meta keys
            if (empty($group_courses)) {
                $meta_keys = [
                    'learndash_group_courses',
                    'ld_group_courses',
                    'group_courses',
                    '_ld_group_courses',
                ];
                foreach ($meta_keys as $meta_key) {
                    $course_ids = get_post_meta($group_id, $meta_key, true);
                    if (is_array($course_ids) && !empty($course_ids)) {
                        $group_courses = $course_ids;
                        break;
                    } elseif (is_numeric($course_ids) && $course_ids > 0) {
                        $group_courses = [$course_ids];
                        break;
                    }
                }
            }
            
            if (!empty($group_courses)) {
                // Ensure all course IDs are integers
                $group_courses = array_map('intval', $group_courses);
                $group_courses = array_filter($group_courses); // Remove zeros
                $group_courses = array_unique($group_courses); // Remove duplicates
                
                // Count how many members completed at least one of the team's courses
                $completed_members = 0;
                $total_progress_sum = 0;
                $members_with_progress = 0;
                
                foreach ($group_users as $user_id) {
                    $user_completed_any = false;
                    $user_progress_sum = 0;
                    $user_courses_count = 0;
                    
                    // Check completion and progress for each team course
                    foreach ($group_courses as $course_id) {
                        // Verify course exists and is published
                        $course = get_post($course_id);
                        if (!$course || $course->post_status !== 'publish') {
                            continue;
                        }
                        
                        // Check if user is enrolled in this course
                        $user_enrolled = false;
                        if (function_exists('learndash_user_get_enrolled_courses')) {
                            $user_courses = learndash_user_get_enrolled_courses($user_id, [], true);
                            $user_enrolled = in_array($course_id, $user_courses);
                        }
                        
                        // Only check progress if user is enrolled
                        if ($user_enrolled) {
                            // Check completion first (most reliable)
                            if (function_exists('learndash_course_completed')) {
                                $is_completed = learndash_course_completed($user_id, $course_id);
                                if ($is_completed) {
                                    $user_completed_any = true;
                                    $user_progress_sum += 100; // Completed = 100%
                                    $user_courses_count++;
                                } else {
                                    // Get progress percentage if not completed
                                    if (function_exists('learndash_course_progress')) {
                                        $progress_data = learndash_course_progress([
                                            'user_id' => $user_id,
                                            'course_id' => $course_id,
                                            'array' => true
                                        ]);
                                        
                                        if (isset($progress_data['percentage']) && is_numeric($progress_data['percentage'])) {
                                            $user_progress_sum += floatval($progress_data['percentage']);
                                            $user_courses_count++;
                                        }
                                    }
                                }
                            } else {
                                // Fallback: Use progress only
                                if (function_exists('learndash_course_progress')) {
                                    $progress_data = learndash_course_progress([
                                        'user_id' => $user_id,
                                        'course_id' => $course_id,
                                        'array' => true
                                    ]);
                                    
                                    if (isset($progress_data['percentage']) && is_numeric($progress_data['percentage'])) {
                                        $progress_percentage = floatval($progress_data['percentage']);
                                        $user_progress_sum += $progress_percentage;
                                        $user_courses_count++;
                                        
                                        // Consider 100% as completed
                                        if ($progress_percentage >= 100) {
                                            $user_completed_any = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    if ($user_completed_any) {
                        $completed_members++;
                    }
                    
                    // Calculate average progress for this user across team courses
                    if ($user_courses_count > 0) {
                        $total_progress_sum += ($user_progress_sum / $user_courses_count);
                        $members_with_progress++;
                    }
                }
                
                // Calculate progress: Prioritize completion rate, fallback to average progress
                if ($completed_members > 0) {
                    // Primary: Percentage of members who completed the course
                    $progress = round(($completed_members / $total_members) * 100);
                } elseif ($members_with_progress > 0) {
                    // Fallback: Average progress percentage across all members
                    $progress = round($total_progress_sum / $members_with_progress);
                } else {
                    $progress = 0;
                }
            } else {
                // No courses found - progress is 0
                $progress = 0;
            }
        }
        
        // Get group status (using custom meta or default to active)
        $status = get_post_meta($group_id, 'group_status', true);
        if (empty($status)) {
            $status = 'Active';
        }
        
        // Filter by status if needed
        if ($status_filter !== 'all' && strtolower($status) !== strtolower($status_filter)) {
            continue;
        }
        
        // Generate avatar initials from group name
        $name_parts = explode(' ', $group->post_title);
        $avatar = '';
        foreach ($name_parts as $part) {
            if (!empty($part)) {
                $avatar .= strtoupper(substr($part, 0, 1));
                if (strlen($avatar) >= 2) break;
            }
        }
        if (strlen($avatar) < 2 && !empty($group->post_title)) {
            $avatar = strtoupper(substr($group->post_title, 0, 2));
        }
        
        $teams[] = [
            'id' => $group_id,
            'name' => $group->post_title,
            'avatar' => $avatar,
            'facilitators' => $facilitators_count,
            'members' => $total_members,
            'progress' => $progress,
            'status' => $status,
            'created' => date('m/d/Y', strtotime($group->post_date)),
        ];
    }
    
    $response = [
        'success' => true,
        'teams' => $teams,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $per_page,
            'total_items' => $query->found_posts,
            'total_pages' => $query->max_num_pages,
        ],
    ];
    
    return new WP_REST_Response($response, 200);
}


/**
 * Register REST API endpoint for Courses List
 */
add_action('rest_api_init', function () {
    register_rest_route('custom-api/v1', '/courses', [
        'methods'             => 'GET',
        'callback'            => 'get_courses_list',
        'permission_callback' => 'is_admin_user',
    ]);
});

function get_courses_list(WP_REST_Request $request) {
    try {
        // Check if LearnDash is active
        if (!class_exists('SFWD_LMS')) {
            return new WP_REST_Response([
                'error' => true,
                'message' => 'LearnDash is not active.',
                'courses' => [],
                'total' => 0,
                'total_pages' => 0,
                'current_page' => 1,
            ], 200);
        }

        $page = $request->get_param('page') ? intval($request->get_param('page')) : 1;
        $per_page = $request->get_param('per_page') ? intval($request->get_param('per_page')) : 100;
        $search = $request->get_param('search');

        $args = array(
            'post_type' => 'sfwd-courses',
            'post_status' => 'publish',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'title',
            'order' => 'ASC'
        );

        if ($search) {
            $args['s'] = sanitize_text_field($search);
        }

        $query = new WP_Query($args);
        $courses = array();

        if ($query->have_posts()) {
            foreach ($query->posts as $post) {
                $course_id = $post->ID;
                
                // Safely get enrollment count
                $enrolled_count = 0;
                if (function_exists('learndash_get_users_for_course')) {
                    $users = learndash_get_users_for_course($course_id, array(), false);
                    $enrolled_count = is_array($users) ? count($users) : 0;
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

        return new WP_REST_Response([
            'courses' => $courses,
            'total' => $query->found_posts,
            'total_pages' => $query->max_num_pages,
            'current_page' => $page,
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'error' => true,
            'message' => 'An error occurred while fetching courses.',
            'details' => $e->getMessage(),
            'courses' => [],
            'total' => 0,
            'total_pages' => 0,
            'current_page' => 1,
        ], 500);
    }
}

/**
 * Register REST API endpoint for Creating Teams (LearnDash Groups)
 */
add_action('rest_api_init', function () {
    if (!class_exists('SFWD_LMS')) {
        error_log('LearnDash not active, skipping /teams POST route.');
        return;
    }

    register_rest_route('custom-api/v1', '/teams', [
        'methods'             => 'POST',
        'callback'            => 'create_team',
        'permission_callback' => 'is_admin_user',
    ]);
});

function create_team(WP_REST_Request $request) {
    try {
        // Get JSON body
        $body = json_decode($request->get_body(), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Invalid JSON in request body.',
            ], 400);
        }
        
        // Get request parameters from JSON body
        $name = isset($body['name']) ? sanitize_text_field($body['name']) : '';
        $course_ids = isset($body['course_ids']) && is_array($body['course_ids']) ? $body['course_ids'] : [];
        $description = isset($body['description']) ? sanitize_textarea_field($body['description']) : '';
        $learner_ids = isset($body['learner_ids']) ? $body['learner_ids'] : [];
        $facilitator_ids = isset($body['facilitator_ids']) && is_array($body['facilitator_ids']) ? $body['facilitator_ids'] : [];

        // Validate required fields
        if (empty($name)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Team name is required.',
            ], 400);
        }

        if (empty($course_ids) || !is_array($course_ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'At least one course is required.',
            ], 400);
        }

        if (empty($learner_ids) || !is_array($learner_ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'At least one learner is required.',
            ], 400);
        }

        global $wpdb;

        // FAST: Batch validate courses - single query
        $course_ids_int = array_map('intval', array_filter(array_unique($course_ids)));
        if (empty($course_ids_int)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'No valid course IDs provided.',
            ], 400);
        }

        $course_placeholders = implode(',', array_fill(0, count($course_ids_int), '%d'));
        $valid_course_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts} 
             WHERE ID IN ($course_placeholders) 
             AND post_type = 'sfwd-courses' 
             AND post_status = 'publish'",
            ...$course_ids_int
        ));
        $valid_course_ids = array_map('intval', $valid_course_ids);

        if (empty($valid_course_ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'No valid courses found.',
            ], 400);
        }

        // FAST: Batch validate learners - single query
        $learner_ids_int = array_map('intval', array_filter(array_unique($learner_ids)));
        if (empty($learner_ids_int)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'No valid learner IDs provided.',
            ], 400);
        }

        $learner_placeholders = implode(',', array_fill(0, count($learner_ids_int), '%d'));
        $valid_learner_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT ID FROM {$wpdb->users} WHERE ID IN ($learner_placeholders)",
            ...$learner_ids_int
        ));
        $valid_learner_ids = array_map('intval', $valid_learner_ids);

        if (empty($valid_learner_ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'No valid learners found.',
            ], 400);
        }

        // FAST: Batch validate facilitators - single query (optional)
        $valid_facilitator_ids = [];
        if (!empty($facilitator_ids)) {
            $facilitator_ids_int = array_map('intval', array_filter(array_unique($facilitator_ids)));
            if (!empty($facilitator_ids_int)) {
                $facilitator_placeholders = implode(',', array_fill(0, count($facilitator_ids_int), '%d'));
                $valid_facilitator_ids = $wpdb->get_col($wpdb->prepare(
                    "SELECT ID FROM {$wpdb->users} WHERE ID IN ($facilitator_placeholders)",
                    ...$facilitator_ids_int
                ));
                $valid_facilitator_ids = array_map('intval', $valid_facilitator_ids);
            }
        }

        // Create LearnDash group
        $group_id = wp_insert_post([
            'post_type'    => 'groups',
            'post_title'   => $name,
            'post_content' => $description ? $description : '',
            'post_status'  => 'publish',
            'post_author'  => get_current_user_id(),
        ], true);

        if (is_wp_error($group_id)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Failed to create team: ' . $group_id->get_error_message(),
            ], 500);
        }

        // FAST: Associate courses with group (single call)
        if (function_exists('learndash_set_group_enrolled_courses')) {
            learndash_set_group_enrolled_courses($group_id, $valid_course_ids);
        } else {
            // FAST: Batch insert course meta
            $time = time();
            $values = [];
            foreach ($valid_course_ids as $course_id) {
                $values[] = $wpdb->prepare("(%d, %s, %d)", $group_id, 'learndash_group_enrolled_' . $course_id, $time);
            }
            if (!empty($values)) {
                $wpdb->query("INSERT INTO {$wpdb->postmeta} (post_id, meta_key, meta_value) VALUES " . implode(',', $values));
            }
        }

        // FAST: Add learners to group using direct database operations
        // This is much faster than calling ld_update_group_access for each user
        if (!empty($valid_learner_ids)) {
            // Disable object cache temporarily for bulk operations
            wp_suspend_cache_addition(true);
            
            // Use LearnDash function if available, but in a more efficient way
            if (function_exists('ld_update_group_access')) {
                // Process in smaller batches to avoid timeout
                $batch_size = 20;
                $batches = array_chunk($valid_learner_ids, $batch_size);
                
                foreach ($batches as $batch) {
                    foreach ($batch as $user_id) {
                        ld_update_group_access($user_id, $group_id, false);
                    }
                }
            } else {
                // Direct database operation (fastest)
                $time = time();
                $values = [];
                foreach ($valid_learner_ids as $user_id) {
                    $values[] = $wpdb->prepare("(%d, %s, %d)", $user_id, 'learndash_group_users_' . $group_id, $time);
                }
                if (!empty($values)) {
                    $wpdb->query("INSERT IGNORE INTO {$wpdb->usermeta} (user_id, meta_key, meta_value) VALUES " . implode(',', $values));
                }
            }
            
            wp_suspend_cache_addition(false);
        }

        // FAST: Add facilitators as group leaders (single call if possible)
        if (!empty($valid_facilitator_ids)) {
            if (function_exists('learndash_set_groups_administrators')) {
                learndash_set_groups_administrators($group_id, $valid_facilitator_ids);
            } elseif (function_exists('ld_update_group_leader_access')) {
                foreach ($valid_facilitator_ids as $facilitator_id) {
                    ld_update_group_leader_access($facilitator_id, $group_id, false);
                }
            } else {
                // Direct database operation
                $time = time();
                $values = [];
                foreach ($valid_facilitator_ids as $facilitator_id) {
                    $values[] = $wpdb->prepare("(%d, %s, %d)", $facilitator_id, 'learndash_group_leaders_' . $group_id, $time);
                }
                if (!empty($values)) {
                    $wpdb->query("INSERT IGNORE INTO {$wpdb->usermeta} (user_id, meta_key, meta_value) VALUES " . implode(',', $values));
                }
            }
        }

        // CRITICAL OPTIMIZATION: Skip manual course enrollment
        // LearnDash automatically enrolls group members in group courses
        // This nested loop is the main performance bottleneck
        // Removing it should reduce creation time from 60s to <5s
        
        // If you find that users are NOT auto-enrolled, uncomment the code below:
        /*
        if (function_exists('ld_update_course_access') && count($valid_learner_ids) * count($valid_course_ids) < 50) {
            // Only do manual enrollment for small operations
            wp_suspend_cache_addition(true);
            foreach ($valid_learner_ids as $user_id) {
                foreach ($valid_course_ids as $course_id) {
                    ld_update_course_access($user_id, $course_id, false);
                }
            }
            wp_suspend_cache_addition(false);
        }
        */

        // Build team response object
        $team = [
            'id'           => $group_id,
            'name'         => $name,
            'avatar'       => (string) count($valid_learner_ids),
            'facilitators' => count($valid_facilitator_ids),
            'members'      => count($valid_learner_ids),
            'progress'     => 0,
            'status'       => 'Active',
            'created'      => current_time('Y-m-d'),
        ];

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Team created successfully',
            'team_id' => $group_id,
            'team'    => $team,
        ], 201);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while creating the team.',
            'details' => $e->getMessage(),
        ], 500);
    }
}
/**
 * Register REST API endpoint for Deleting Teams (LearnDash Groups)
 */
add_action('rest_api_init', function () {
    register_rest_route('custom-api/v1', '/teams/(?P<id>\d+)', [
        'methods'             => 'DELETE',
        'callback'            => 'delete_team',
        'permission_callback' => 'is_admin_user',
        'args' => [
            'id' => [
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ],
        ],
    ]);
});

function delete_team(WP_REST_Request $request) {
    try {
        $team_id = $request->get_param('id');
        
        // Get team data before deletion
        $team = get_post($team_id);
        
        if (!$team || $team->post_type !== 'groups') {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Team not found.',
            ], 404);
        }
        
        // Store team info for response
        $team_name = $team->post_title;
        $team_members = learndash_get_groups_user_ids($team_id);
        $member_count = count($team_members);
        
        // Remove all users from the group before deletion
        if (!empty($team_members) && function_exists('ld_update_group_access')) {
            foreach ($team_members as $user_id) {
                ld_update_group_access($user_id, $team_id, true); // true = remove access
            }
        }
        
        // Delete the group post
        $result = wp_delete_post($team_id, true); // true = force delete (skip trash)
        
        if (!$result) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Failed to delete team. Please try again.',
            ], 500);
        }
        
        return new WP_REST_Response([
            'success' => true,
            'message' => 'Team deleted successfully',
            'deleted_team_id' => $team_id,
            'deleted_team_name' => $team_name,
            'removed_members' => $member_count,
        ], 200);
        
    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while deleting the team.',
            'details' => $e->getMessage(),
        ], 500);
    }
}


/**
 * Register REST API endpoint for Getting Team Members
 */
add_action('rest_api_init', function () {
    register_rest_route('custom-api/v1', '/teams/(?P<id>\d+)/members', [
        'methods'             => 'GET',
        'callback'            => 'get_team_members',
        'permission_callback' => 'is_admin_user',
        'args' => [
            'id' => [
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ],
        ],
    ]);
});

function get_team_members(WP_REST_Request $request) {
    try {
        $team_id = $request->get_param('id');
        
        // Get team data
        $team = get_post($team_id);
        
        if (!$team || $team->post_type !== 'groups') {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Team not found.',
            ], 404);
        }
        
        // Get group users
        $member_ids = learndash_get_groups_user_ids($team_id);
        $members = [];
        
        if (!empty($member_ids)) {
            foreach ($member_ids as $user_id) {
                $user = get_userdata($user_id);
                
                if (!$user) continue;
                
                // Get user's last login
                $last_login = get_user_meta($user_id, 'last_login', true);
                $last_activity = $last_login ? human_time_diff($last_login, current_time('timestamp')) . ' ago' : 'Never';
                
                // Determine if active (logged in within last 30 days)
                $days_since_login = $last_login ? floor((time() - $last_login) / (60 * 60 * 24)) : 999;
                $status = ($days_since_login <= 30) ? 'Active' : 'Inactive';
                
                // Get user role
                $roles = $user->roles;
                $role = 'Learner'; // Default
                if (in_array('group_leader', $roles)) {
                    $role = 'Manager';
                } elseif (in_array('group_leader_clone', $roles)) {
                    $role = 'Facilitator';
                } elseif (in_array('subscriber', $roles)) {
                    $role = 'Learner';
                }
                
                // Get join date (when added to group)
                $join_date = get_user_meta($user_id, 'ld_group_' . $team_id . '_joined', true);
                if (!$join_date) {
                    $join_date = $user->user_registered;
                }
                
                $members[] = [
                    'id' => $user_id,
                    'name' => $user->display_name,
                    'email' => $user->user_email,
                    'avatar' => strtoupper(substr($user->display_name, 0, 2)),
                    'role' => $role,
                    'joinDate' => date('m/d/Y', strtotime($join_date)),
                    'lastActivity' => $last_activity,
                    'status' => $status,
                ];
            }
        }
        
        return new WP_REST_Response([
            'success' => true,
            'members' => $members,
            'total' => count($members),
        ], 200);
        
    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while fetching team members.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Register REST API endpoint for Removing Team Member
 */
add_action('rest_api_init', function () {
    register_rest_route('custom-api/v1', '/teams/(?P<team_id>\d+)/members/(?P<user_id>\d+)', [
        'methods'             => 'DELETE',
        'callback'            => 'remove_team_member',
        'permission_callback' => 'is_admin_user',
        'args' => [
            'team_id' => [
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ],
            'user_id' => [
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ],
        ],
    ]);
});

function remove_team_member(WP_REST_Request $request) {
    try {
        $team_id = $request->get_param('team_id');
        $user_id = $request->get_param('user_id');
        
        // Validate team exists
        $team = get_post($team_id);
        if (!$team || $team->post_type !== 'groups') {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Team not found.',
            ], 404);
        }
        
        // Validate user exists
        $user = get_userdata($user_id);
        if (!$user) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }
        
        // Remove user from group
        if (function_exists('ld_update_group_access')) {
            ld_update_group_access($user_id, $team_id, true); // true = remove
        }
        
        return new WP_REST_Response([
            'success' => true,
            'message' => 'Member removed from team successfully',
            'removed_user_id' => $user_id,
            'removed_user_name' => $user->display_name,
        ], 200);
        
    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while removing the member.',
            'details' => $e->getMessage(),
        ], 500);
    }
}


/**
 * Register REST API endpoint for Getting Single Team Details
 */
add_action('rest_api_init', function () {
    if (!class_exists('SFWD_LMS')) {
        error_log('LearnDash not active, skipping /teams/{id} GET route.');
        return;
    }

    register_rest_route('custom-api/v1', '/teams/(?P<id>\d+)', [
        'methods'             => 'GET',
        'callback'            => 'get_team_details',
        'permission_callback' => 'is_admin_user',
        'args' => [
            'id' => [
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ],
        ],
    ]);
});

function get_team_details(WP_REST_Request $request) {
    try {
        $team_id = intval($request->get_param('id'));
        
        // Get team data
        $team = get_post($team_id);
        if (!$team || $team->post_type !== 'groups') {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Team not found.',
            ], 404);
        }

        // Get group courses - use multiple fallback methods (same as get_teams_list)
        $course_ids = [];
        
        // Method 1: Use LearnDash function (most common)
        if (function_exists('learndash_get_group_courses')) {
            $course_ids = learndash_get_group_courses($team_id);
            if (!is_array($course_ids)) {
                $course_ids = [];
            }
        }
        
        // Method 2: Try alternative LearnDash function
        if (empty($course_ids) && function_exists('learndash_group_enrolled_courses')) {
            $course_ids = learndash_group_enrolled_courses($team_id);
            if (!is_array($course_ids)) {
                $course_ids = [];
            }
        }
        
        // Method 3: Get from post meta (LearnDash stores courses here)
        if (empty($course_ids)) {
            $course_ids_meta = get_post_meta($team_id, 'learndash_group_enrolled_courses', true);
            if (is_array($course_ids_meta) && !empty($course_ids_meta)) {
                $course_ids = $course_ids_meta;
            } elseif (is_numeric($course_ids_meta) && $course_ids_meta > 0) {
                $course_ids = [$course_ids_meta];
            }
        }
        
        // Method 4: Check for individual course meta keys (from create_team fallback)
        if (empty($course_ids)) {
            global $wpdb;
            $meta_keys = $wpdb->get_col($wpdb->prepare(
                "SELECT meta_key FROM {$wpdb->postmeta} 
                 WHERE post_id = %d 
                 AND meta_key LIKE 'learndash_group_enrolled_%%'",
                $team_id
            ));
            foreach ($meta_keys as $meta_key) {
                $course_id = str_replace('learndash_group_enrolled_', '', $meta_key);
                if (is_numeric($course_id) && $course_id > 0) {
                    $course_ids[] = intval($course_id);
                }
            }
        }
        
        // Method 5: Try other common meta keys
        if (empty($course_ids)) {
            $meta_keys = [
                'learndash_group_courses',
                'ld_group_courses',
                'group_courses',
                '_ld_group_courses',
            ];
            foreach ($meta_keys as $meta_key) {
                $course_ids_meta = get_post_meta($team_id, $meta_key, true);
                if (is_array($course_ids_meta) && !empty($course_ids_meta)) {
                    $course_ids = $course_ids_meta;
                    break;
                } elseif (is_numeric($course_ids_meta) && $course_ids_meta > 0) {
                    $course_ids = [$course_ids_meta];
                    break;
                }
            }
        }
        
        // Clean course IDs
        if (!empty($course_ids)) {
            $course_ids = array_map('intval', $course_ids);
            $course_ids = array_filter($course_ids);
            $course_ids = array_unique($course_ids);
        }

        // Get group members (learners)
        $member_ids = [];
        if (function_exists('learndash_get_groups_user_ids')) {
            $member_ids = learndash_get_groups_user_ids($team_id);
            if (!is_array($member_ids)) {
                $member_ids = [];
            }
        }

        // Get group administrators (facilitators) with details
        $facilitator_ids = [];
        $facilitators = [];
        if (function_exists('learndash_get_groups_administrator_ids')) {
            $facilitator_ids = learndash_get_groups_administrator_ids($team_id);
            if (!is_array($facilitator_ids)) {
                $facilitator_ids = [];
            }
            
            // Get facilitator details
            foreach ($facilitator_ids as $facilitator_id) {
                $facilitator_user = get_userdata($facilitator_id);
                if ($facilitator_user) {
                    $avatar_url = get_avatar_url($facilitator_id, ['size' => 96]);
                    $facilitators[] = [
                        'id' => $facilitator_id,
                        'display_name' => $facilitator_user->display_name,
                        'avatar_url' => $avatar_url ? $avatar_url : '',
                    ];
                }
            }
        }

        return new WP_REST_Response([
            'success' => true,
            'team' => [
                'id' => $team_id,
                'name' => $team->post_title,
                'description' => $team->post_content,
                'course_ids' => $course_ids,
                'learner_ids' => array_map('intval', $member_ids),
                'facilitator_ids' => array_map('intval', $facilitator_ids),
                'facilitators' => $facilitators,
            ],
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while fetching team details.',
            'details' => $e->getMessage(),
        ], 500);
    }
}
/**
 * Register REST API endpoint for Updating Teams (LearnDash Groups)
 */
add_action('rest_api_init', function () {
    if (!class_exists('SFWD_LMS')) {
        error_log('LearnDash not active, skipping /teams/{id} PUT route.');
        return;
    }

    register_rest_route('custom-api/v1', '/teams/(?P<id>\d+)', [
        'methods'             => 'PUT',
        'callback'            => 'update_team',
        'permission_callback' => 'is_admin_user',
        'args' => [
            'id' => [
                'validate_callback' => function($param) {
                    return is_numeric($param);
                }
            ],
        ],
    ]);
});

function update_team(WP_REST_Request $request) {
    try {
        $team_id = intval($request->get_param('id'));
        
        // Get team data
        $team = get_post($team_id);
        if (!$team || $team->post_type !== 'groups') {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Team not found.',
            ], 404);
        }

        // Get JSON body
        $body = json_decode($request->get_body(), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Invalid JSON in request body.',
            ], 400);
        }
        
        // Get request parameters from JSON body
        $name = isset($body['name']) ? sanitize_text_field($body['name']) : '';
        $course_ids = isset($body['course_ids']) && is_array($body['course_ids']) ? $body['course_ids'] : [];
        $description = isset($body['description']) ? sanitize_textarea_field($body['description']) : '';
        $learner_ids = isset($body['learner_ids']) ? $body['learner_ids'] : [];
        $facilitator_ids = isset($body['facilitator_ids']) && is_array($body['facilitator_ids']) ? $body['facilitator_ids'] : [];

        // Validate required fields
        if (empty($name)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Team name is required.',
            ], 400);
        }

        if (empty($course_ids) || !is_array($course_ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'At least one course is required.',
            ], 400);
        }

        if (empty($learner_ids) || !is_array($learner_ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'At least one learner is required.',
            ], 400);
        }

        global $wpdb;

        // FAST: Batch validate courses - single query
        $course_ids_int = array_map('intval', array_filter(array_unique($course_ids)));
        if (empty($course_ids_int)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'No valid course IDs provided.',
            ], 400);
        }

        $course_placeholders = implode(',', array_fill(0, count($course_ids_int), '%d'));
        $valid_course_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts} 
             WHERE ID IN ($course_placeholders) 
             AND post_type = 'sfwd-courses' 
             AND post_status = 'publish'",
            ...$course_ids_int
        ));
        $valid_course_ids = array_map('intval', $valid_course_ids);

        if (empty($valid_course_ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'No valid courses found.',
            ], 400);
        }

        // FAST: Batch validate learners - single query
        $learner_ids_int = array_map('intval', array_filter(array_unique($learner_ids)));
        if (empty($learner_ids_int)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'No valid learner IDs provided.',
            ], 400);
        }

        $learner_placeholders = implode(',', array_fill(0, count($learner_ids_int), '%d'));
        $valid_learner_ids = $wpdb->get_col($wpdb->prepare(
            "SELECT ID FROM {$wpdb->users} WHERE ID IN ($learner_placeholders)",
            ...$learner_ids_int
        ));
        $valid_learner_ids = array_map('intval', $valid_learner_ids);

        if (empty($valid_learner_ids)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'No valid learners found.',
            ], 400);
        }

        // FAST: Batch validate facilitators - single query (optional)
        $valid_facilitator_ids = [];
        if (!empty($facilitator_ids)) {
            $facilitator_ids_int = array_map('intval', array_filter(array_unique($facilitator_ids)));
            if (!empty($facilitator_ids_int)) {
                $facilitator_placeholders = implode(',', array_fill(0, count($facilitator_ids_int), '%d'));
                $valid_facilitator_ids = $wpdb->get_col($wpdb->prepare(
                    "SELECT ID FROM {$wpdb->users} WHERE ID IN ($facilitator_placeholders)",
                    ...$facilitator_ids_int
                ));
                $valid_facilitator_ids = array_map('intval', $valid_facilitator_ids);
            }
        }

        // Update team post
        $update_result = wp_update_post([
            'ID'           => $team_id,
            'post_title'   => $name,
            'post_content' => $description ? $description : '',
        ], true);

        if (is_wp_error($update_result)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Failed to update team: ' . $update_result->get_error_message(),
            ], 500);
        }

        // FAST: Get current group members (single call)
        $current_member_ids = [];
        if (function_exists('learndash_get_groups_user_ids')) {
            $current_member_ids = learndash_get_groups_user_ids($team_id);
            if (!is_array($current_member_ids)) {
                $current_member_ids = [];
            }
        }
        $current_member_ids = array_map('intval', $current_member_ids);

        // Calculate members to add/remove
        $members_to_remove = array_diff($current_member_ids, $valid_learner_ids);
        $members_to_add = array_diff($valid_learner_ids, $current_member_ids);

        // FAST: Remove members that are no longer in the list
        if (!empty($members_to_remove)) {
            wp_suspend_cache_addition(true);
            
            if (function_exists('ld_update_group_access')) {
                // Process in batches
                $batches = array_chunk($members_to_remove, 20);
                foreach ($batches as $batch) {
                    foreach ($batch as $user_id) {
                        ld_update_group_access($user_id, $team_id, true); // true = remove
                    }
                }
            } else {
                // Direct database operation
                $placeholders = implode(',', array_fill(0, count($members_to_remove), '%d'));
                $wpdb->query($wpdb->prepare(
                    "DELETE FROM {$wpdb->usermeta} 
                     WHERE user_id IN ($placeholders) 
                     AND meta_key = %s",
                    ...array_merge($members_to_remove, ['learndash_group_users_' . $team_id])
                ));
            }
            
            wp_suspend_cache_addition(false);
        }

        // FAST: Add new members
        if (!empty($members_to_add)) {
            wp_suspend_cache_addition(true);
            
            if (function_exists('ld_update_group_access')) {
                // Process in batches
                $batches = array_chunk($members_to_add, 20);
                foreach ($batches as $batch) {
                    foreach ($batch as $user_id) {
                        ld_update_group_access($user_id, $team_id, false); // false = add
                    }
                }
            } else {
                // Direct database operation
                $time = time();
                $values = [];
                foreach ($members_to_add as $user_id) {
                    $values[] = $wpdb->prepare("(%d, %s, %d)", $user_id, 'learndash_group_users_' . $team_id, $time);
                }
                if (!empty($values)) {
                    $wpdb->query("INSERT IGNORE INTO {$wpdb->usermeta} (user_id, meta_key, meta_value) VALUES " . implode(',', $values));
                }
            }
            
            wp_suspend_cache_addition(false);
        }

        // FAST: Update course associations (single call)
        if (function_exists('learndash_set_group_enrolled_courses')) {
            learndash_set_group_enrolled_courses($team_id, $valid_course_ids);
        } else {
            // Fallback: Remove old courses and add new ones
            // Get old courses
            $old_courses = [];
            if (function_exists('learndash_get_group_courses')) {
                $old_courses = learndash_get_group_courses($team_id);
                if (!is_array($old_courses)) {
                    $old_courses = [];
                }
            }
            
            // FAST: Batch delete old course meta
            if (!empty($old_courses)) {
                $old_placeholders = implode(',', array_fill(0, count($old_courses), '%s'));
                $wpdb->query($wpdb->prepare(
                    "DELETE FROM {$wpdb->postmeta} 
                     WHERE post_id = %d 
                     AND meta_key IN ($old_placeholders)",
                    $team_id,
                    ...array_map(function($id) { return 'learndash_group_enrolled_' . $id; }, $old_courses)
                ));
            }
            
            // FAST: Batch insert new course meta
            $time = time();
            $values = [];
            foreach ($valid_course_ids as $course_id) {
                $values[] = $wpdb->prepare("(%d, %s, %d)", $team_id, 'learndash_group_enrolled_' . $course_id, $time);
            }
            if (!empty($values)) {
                $wpdb->query("INSERT INTO {$wpdb->postmeta} (post_id, meta_key, meta_value) VALUES " . implode(',', $values) . " ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)");
            }
        }

        // FAST: Update facilitators (group leaders)
        if (function_exists('learndash_set_groups_administrators')) {
            learndash_set_groups_administrators($team_id, $valid_facilitator_ids);
        } elseif (function_exists('ld_update_group_leader_access')) {
            // Get current facilitators
            $current_facilitator_ids = [];
            if (function_exists('learndash_get_groups_administrator_ids')) {
                $current_facilitator_ids = learndash_get_groups_administrator_ids($team_id);
                if (!is_array($current_facilitator_ids)) {
                    $current_facilitator_ids = [];
                }
            }
            $current_facilitator_ids = array_map('intval', $current_facilitator_ids);
            
            // Calculate facilitators to add/remove
            $facilitators_to_remove = array_diff($current_facilitator_ids, $valid_facilitator_ids);
            $facilitators_to_add = array_diff($valid_facilitator_ids, $current_facilitator_ids);
            
            // Remove old facilitators
            foreach ($facilitators_to_remove as $facilitator_id) {
                ld_update_group_leader_access($facilitator_id, $team_id, true); // true = remove
            }
            
            // Add new facilitators
            foreach ($facilitators_to_add as $facilitator_id) {
                ld_update_group_leader_access($facilitator_id, $team_id, false); // false = add
            }
        } else {
            // Direct database operation
            $current_facilitator_ids = [];
            if (function_exists('learndash_get_groups_administrator_ids')) {
                $current_facilitator_ids = learndash_get_groups_administrator_ids($team_id);
                if (!is_array($current_facilitator_ids)) {
                    $current_facilitator_ids = [];
                }
            }
            $current_facilitator_ids = array_map('intval', $current_facilitator_ids);
            
            $facilitators_to_remove = array_diff($current_facilitator_ids, $valid_facilitator_ids);
            $facilitators_to_add = array_diff($valid_facilitator_ids, $current_facilitator_ids);
            
            // Batch remove
            if (!empty($facilitators_to_remove)) {
                $placeholders = implode(',', array_fill(0, count($facilitators_to_remove), '%d'));
                $wpdb->query($wpdb->prepare(
                    "DELETE FROM {$wpdb->usermeta} 
                     WHERE user_id IN ($placeholders) 
                     AND meta_key = %s",
                    ...array_merge($facilitators_to_remove, ['learndash_group_leaders_' . $team_id])
                ));
            }
            
            // Batch add
            if (!empty($facilitators_to_add)) {
                $time = time();
                $values = [];
                foreach ($facilitators_to_add as $facilitator_id) {
                    $values[] = $wpdb->prepare("(%d, %s, %d)", $facilitator_id, 'learndash_group_leaders_' . $team_id, $time);
                }
                if (!empty($values)) {
                    $wpdb->query("INSERT IGNORE INTO {$wpdb->usermeta} (user_id, meta_key, meta_value) VALUES " . implode(',', $values));
                }
            }
        }

        // CRITICAL OPTIMIZATION: Skip manual course enrollment
        // LearnDash automatically enrolls group members in group courses
        // This nested loop is the main performance bottleneck
        // Removing it should reduce update time from 60s to <5s
        
        // If you find that users are NOT auto-enrolled, uncomment the code below:
        /*
        if (function_exists('ld_update_course_access') && count($valid_learner_ids) * count($valid_course_ids) < 50) {
            // Only do manual enrollment for small operations
            wp_suspend_cache_addition(true);
            foreach ($valid_learner_ids as $user_id) {
                foreach ($valid_course_ids as $course_id) {
                    ld_update_course_access($user_id, $course_id, false);
                }
            }
            wp_suspend_cache_addition(false);
        }
        */

        // Build team response object
        $team = [
            'id'           => $team_id,
            'name'         => $name,
            'avatar'       => (string) count($valid_learner_ids),
            'facilitators' => count($valid_facilitator_ids),
            'members'      => count($valid_learner_ids),
            'progress'     => 0, // Progress will be recalculated on next fetch
            'status'       => 'Active',
            'created'      => get_the_date('Y-m-d', $team_id),
        ];

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Team updated successfully',
            'team_id' => $team_id,
            'team'    => $team,
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while updating the team.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Register REST API endpoint for Course Report (User Enrollment & Completion)
 */
add_action('rest_api_init', function () {
    if (!class_exists('SFWD_LMS')) {
        error_log('LearnDash not active, skipping /course-report route.');
        return;
    }

    register_rest_route('custom-api/v1', '/course-report', [
        'methods'             => 'GET',
        'callback'            => 'get_course_report',
        'permission_callback' => 'is_admin_user', // Restrict to admin
    ]);
});

/**
 * Get course report with enrollment and completion statistics
 */
function get_course_report(WP_REST_Request $request) {
    global $wpdb;

    try {
        // Validate LearnDash DB table exists
        $table = $wpdb->prefix . 'learndash_user_activity';
        $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));
        
        if (!$exists) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'LearnDash activity table not found.',
            ], 404);
        }

        // Get query parameters
        $page = max(1, intval($request->get_param('page')) ?: 1);
        $per_page = max(1, min(100, intval($request->get_param('per_page')) ?: 10));
        $search = sanitize_text_field($request->get_param('search') ?: '');
        $days = intval($request->get_param('days')) ?: 0; // 0 = all time

        // Get all published courses
        $course_args = [
            'post_type'      => 'sfwd-courses',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'fields'         => 'ids',
        ];

        if ($search) {
            $course_args['s'] = $search;
        }

        $course_ids = get_posts($course_args);
        
        if (empty($course_ids)) {
            return new WP_REST_Response([
                'success' => true,
                'data' => [],
                'total' => 0,
                'page' => $page,
                'per_page' => $per_page,
            ], 200);
        }

        // Calculate pagination
        $total_courses = count($course_ids);
        $offset = ($page - 1) * $per_page;
        $paginated_course_ids = array_slice($course_ids, $offset, $per_page);

        $courses_report = [];

        foreach ($paginated_course_ids as $course_id) {
            $course_title = get_the_title($course_id);
            
            // Skip if search doesn't match course title
            if ($search && stripos($course_title, $search) === false) {
                continue;
            }

            // COMPREHENSIVE METHOD TO GET ALL ENROLLED USERS
            $enrolled_user_ids = [];
            
            // Check if this is an open course (available to all users)
            $course_price_type = learndash_get_course_meta_setting($course_id, 'course_price_type');
            
            if ($course_price_type === 'open') {
                // For open courses, ALL users are considered enrolled
                $all_users = get_users(['fields' => 'ids', 'number' => -1]);
                $enrolled_user_ids = $all_users;
            } else {
                // METHOD 1: Get directly enrolled users via course access meta
                $direct_enrolled = $wpdb->get_col($wpdb->prepare("
                    SELECT DISTINCT user_id 
                    FROM {$wpdb->usermeta}
                    WHERE meta_key = %s
                    AND meta_value != ''
                    AND meta_value != '0'
                ", 'course_' . $course_id . '_access_from'));
                
                if (!empty($direct_enrolled)) {
                    $enrolled_user_ids = array_merge($enrolled_user_ids, $direct_enrolled);
                }
                
                // METHOD 2: Get users enrolled via course access list
                $access_list_users = $wpdb->get_col($wpdb->prepare("
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
                ));
                
                if (!empty($access_list_users)) {
                    $enrolled_user_ids = array_merge($enrolled_user_ids, $access_list_users);
                }
                
                // METHOD 3: Get group-enrolled users
                // First, find all groups that have this course
                $groups_with_course = $wpdb->get_col($wpdb->prepare("
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
                ));
                
                // Now get all users in those groups
                if (!empty($groups_with_course)) {
                    foreach ($groups_with_course as $group_id) {
                        // Verify the group is published
                        if (get_post_status($group_id) !== 'publish') {
                            continue;
                        }
                        
                        // Get users in this group
                        $group_users = $wpdb->get_col($wpdb->prepare("
                            SELECT DISTINCT user_id 
                            FROM {$wpdb->usermeta}
                            WHERE meta_key = %s
                            AND meta_value != ''
                            AND meta_value != '0'
                        ", 'learndash_group_users_' . $group_id));
                        
                        if (!empty($group_users)) {
                            $enrolled_user_ids = array_merge($enrolled_user_ids, $group_users);
                        }
                    }
                }
                
                // METHOD 4: Use LearnDash function if available (as additional check)
                if (function_exists('learndash_get_course_groups')) {
                    $course_groups = learndash_get_course_groups($course_id, true);
                    if (!empty($course_groups)) {
                        foreach ($course_groups as $group_id) {
                            if (function_exists('learndash_get_groups_user_ids')) {
                                $group_users = learndash_get_groups_user_ids($group_id);
                                if (is_array($group_users) && !empty($group_users)) {
                                    $enrolled_user_ids = array_merge($enrolled_user_ids, $group_users);
                                }
                            }
                        }
                    }
                }
                
                // METHOD 5: Check for users with activity in this course (catch any missed enrollments)
                $activity_users = $wpdb->get_col($wpdb->prepare("
                    SELECT DISTINCT user_id 
                    FROM {$table}
                    WHERE post_id = %d
                    AND activity_type = 'course'
                    AND user_id > 0
                ", $course_id));
                
                if (!empty($activity_users)) {
                    $enrolled_user_ids = array_merge($enrolled_user_ids, $activity_users);
                }
            }
            
            // Remove duplicates and ensure all are valid user IDs
            $enrolled_user_ids = array_unique(array_map('intval', $enrolled_user_ids));
            $enrolled_user_ids = array_filter($enrolled_user_ids, function($id) {
                return $id > 0;
            });
            
            $enrolled = count($enrolled_user_ids);

            if ($enrolled === 0) {
                // Course with no enrollments
                $courses_report[] = [
                    'id' => (string) $course_id,
                    'name' => $course_title,
                    'enrolled' => 0,
                    'notStarted' => 0,
                    'inProgress' => 0,
                    'completed' => 0,
                    'completionRate' => '0%',
                    'quizScore' => '0%',
                    'avgTime' => '0h 0m',
                ];
                continue;
            }

            // Count completed, in progress, and not started users
            $completed = 0;
            $in_progress = 0;
            $not_started = 0;

            // Batch check for better performance on large user sets
            if (count($enrolled_user_ids) > 100) {
                // For large datasets, use SQL queries for better performance
                
                // Get completed users
                $completed_users = $wpdb->get_col($wpdb->prepare("
                    SELECT DISTINCT user_id 
                    FROM {$table}
                    WHERE post_id = %d
                    AND user_id IN (" . implode(',', $enrolled_user_ids) . ")
                    AND activity_type = 'course'
                    AND activity_status = 1
                ", $course_id));
                
                $completed = count($completed_users);
                
                // Get users who started but not completed
                $started_users = $wpdb->get_col($wpdb->prepare("
                    SELECT DISTINCT user_id 
                    FROM {$table}
                    WHERE post_id = %d
                    AND user_id IN (" . implode(',', $enrolled_user_ids) . ")
                    AND activity_type = 'course'
                    AND activity_started > 0
                    AND (activity_status = 0 OR activity_status IS NULL)
                ", $course_id));
                
                $in_progress = count($started_users);
                
                // Calculate not started
                $not_started = $enrolled - $completed - $in_progress;
                
            } else {
                // For smaller datasets, check each user individually
                foreach ($enrolled_user_ids as $user_id) {
                    // Check if course is completed
                    $is_completed = false;
                    
                    // Check via activity table first (fastest)
                    $completion_status = $wpdb->get_var($wpdb->prepare("
                        SELECT activity_status 
                        FROM {$table}
                        WHERE post_id = %d
                        AND user_id = %d
                        AND activity_type = 'course'
                        ORDER BY activity_id DESC
                        LIMIT 1
                    ", $course_id, $user_id));
                    
                    if ($completion_status == 1) {
                        $completed++;
                    } else {
                        // Check if user has started the course
                        $has_started = $wpdb->get_var($wpdb->prepare("
                            SELECT COUNT(*)
                            FROM {$table}
                            WHERE post_id = %d
                            AND user_id = %d
                            AND activity_type = 'course'
                            AND activity_started > 0
                        ", $course_id, $user_id));

                        if ($has_started > 0) {
                            $in_progress++;
                        } else {
                            $not_started++;
                        }
                    }
                }
            }

            // Calculate completion rate
            $completion_rate = $enrolled > 0 ? round(($completed / $enrolled) * 100, 1) : 0;

            // Get average quiz score for this course
            $quiz_scores = $wpdb->get_col($wpdb->prepare("
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
            ", $course_id));

            $avg_quiz_score = 0;
            if (!empty($quiz_scores)) {
                $avg_quiz_score = round(array_sum($quiz_scores) / count($quiz_scores), 1);
            }

            // Calculate average time spent for completed courses
            $time_data = $wpdb->get_results($wpdb->prepare("
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
            ", $course_id), ARRAY_A);

            $total_seconds = 0;
            $time_count = 0;
            
            foreach ($time_data as $time_row) {
                $started = intval($time_row['started']);
                $completed_time = intval($time_row['completed']);
                
                if ($completed_time > $started) {
                    $time_diff = $completed_time - $started;
                    // Filter out unrealistic times (less than 1 minute or more than 365 days)
                    if ($time_diff >= 60 && $time_diff <= 31536000) {
                        $total_seconds += $time_diff;
                        $time_count++;
                    }
                }
            }

            $avg_time_str = '0h 0m';
            if ($time_count > 0) {
                $avg_seconds = $total_seconds / $time_count;
                $hours = floor($avg_seconds / 3600);
                $minutes = floor(($avg_seconds % 3600) / 60);
                $avg_time_str = $hours . 'h ' . $minutes . 'm';
            }

            $courses_report[] = [
                'id' => (string) $course_id,
                'name' => $course_title,
                'enrolled' => $enrolled,
                'notStarted' => $not_started,
                'inProgress' => $in_progress,
                'completed' => $completed,
                'completionRate' => $completion_rate . '%',
                'quizScore' => $avg_quiz_score . '%',
                'avgTime' => $avg_time_str,
            ];
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $courses_report,
            'total' => $total_courses,
            'page' => $page,
            'per_page' => $per_page,
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while fetching course report.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Register REST API endpoint for Learner Report
 */
add_action('rest_api_init', function () {
    if (!class_exists('SFWD_LMS')) {
        error_log('LearnDash not active, skipping /learner-report route.');
        return;
    }

    register_rest_route('custom-api/v1', '/learner-report', [
        'methods'             => 'GET',
        'callback'            => 'get_learner_report',
        'permission_callback' => 'is_admin_user', // Restrict to admin
    ]);
});

/**
 * Get learner report with enrollment and completion statistics
 */
function get_learner_report(WP_REST_Request $request) {
    global $wpdb;

    try {
        // Validate LearnDash DB table exists
        $table = $wpdb->prefix . 'learndash_user_activity';
        $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));
        
        if (!$exists) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'LearnDash activity table not found.',
            ], 404);
        }

        // Get query parameters
        $page = max(1, intval($request->get_param('page')) ?: 1);
        $per_page = max(1, min(100, intval($request->get_param('per_page')) ?: 10));
        $search = sanitize_text_field($request->get_param('search') ?: '');
        $days = intval($request->get_param('days')) ?: 0; // 0 = all time

        // Check if meta table exists (for quiz scores)
        $meta_table = $wpdb->prefix . 'learndash_user_activity_meta';
        $meta_table_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $meta_table));

        // Build optimized query to get distinct users who have course activity
        // This avoids loading all users into memory
        $users_table = $wpdb->users;
        $usermeta_table = $wpdb->usermeta;
        
        // Base query: Get distinct users who have activity in courses
        $search_condition = '';
        $search_params = [];
        
        if ($search) {
            $search_term = '%' . $wpdb->esc_like($search) . '%';
            $search_condition = " AND (
                u.display_name LIKE %s OR 
                u.user_email LIKE %s OR 
                u.user_login LIKE %s
            )";
            $search_params = [$search_term, $search_term, $search_term];
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
        
        if ($search) {
            $count_query = $wpdb->prepare($count_query, $search_params);
        }
        
        $total_learners = (int) $wpdb->get_var($count_query);

        if ($total_learners === 0) {
            return new WP_REST_Response([
                'success' => true,
                'data' => [],
                'total' => 0,
                'page' => $page,
                'per_page' => $per_page,
            ], 200);
        }

        // Get paginated user IDs with user data in one query
        $offset = ($page - 1) * $per_page;
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
        
        if ($search) {
            $users_query = $wpdb->prepare($users_query, array_merge($search_params, [$per_page, $offset]));
        } else {
            $users_query = $wpdb->prepare($users_query, [$per_page, $offset]);
        }
        
        $users = $wpdb->get_results($users_query, ARRAY_A);

        if (empty($users)) {
            return new WP_REST_Response([
                'success' => true,
                'data' => [],
                'total' => $total_learners,
                'page' => $page,
                'per_page' => $per_page,
            ], 200);
        }

        // Extract user IDs for batch processing
        $user_ids = array_column($users, 'user_id');
        $user_ids_placeholder = implode(',', array_fill(0, count($user_ids), '%d'));

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
        $enrolled_courses = $wpdb->get_results($wpdb->prepare($enrolled_courses_query, $user_ids), ARRAY_A);
        $enrolled_map = [];
        foreach ($enrolled_courses as $row) {
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
        $completed_courses = $wpdb->get_results($wpdb->prepare($completed_courses_query, $user_ids), ARRAY_A);
        $completed_map = [];
        foreach ($completed_courses as $row) {
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
        $time_data = $wpdb->get_results($wpdb->prepare($time_query, $user_ids), ARRAY_A);
        $time_map = [];
        foreach ($time_data as $row) {
            $time_map[$row['user_id']] = (int) $row['total_seconds'];
        }

        // Get average quiz scores per user (optimized batch query)
        $quiz_scores_map = [];
        if ($meta_table_exists) {
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
            $quiz_data = $wpdb->get_results($wpdb->prepare($quiz_query, $user_ids), ARRAY_A);
            foreach ($quiz_data as $row) {
                if ($row['quiz_count'] > 0) {
                    $quiz_scores_map[$row['user_id']] = round((float) $row['avg_score'], 1);
                }
            }
        }

        // Build response array
        $learners_report = [];
        foreach ($users as $user_data) {
            $user_id = (int) $user_data['user_id'];
            $courses_enrolled = isset($enrolled_map[$user_id]) ? $enrolled_map[$user_id] : 0;
            
            // Skip users with no enrolled courses
            if ($courses_enrolled === 0) {
                continue;
            }

            $courses_completed = isset($completed_map[$user_id]) ? $completed_map[$user_id] : 0;
            $total_seconds = isset($time_map[$user_id]) ? $time_map[$user_id] : 0;
            $total_hours = floor($total_seconds / 3600);
            $average_score = isset($quiz_scores_map[$user_id]) ? $quiz_scores_map[$user_id] : 0;

            // Format learner ID
            $learner_id = 'L' . str_pad($user_id, 3, '0', STR_PAD_LEFT);

            $learners_report[] = [
                'id' => $learner_id,
                'name' => $user_data['display_name'],
                'email' => $user_data['user_email'],
                'coursesEnrolled' => $courses_enrolled,
                'coursesCompleted' => $courses_completed,
                'totalHours' => $total_hours,
                'averageScore' => $average_score . '%',
            ];
        }

        return new WP_REST_Response([
            'success' => true,
            'data' => $learners_report,
            'total' => $total_learners,
            'page' => $page,
            'per_page' => $per_page,
        ], 200);

    } catch (Exception $e) {
        error_log('Learner report error: ' . $e->getMessage());
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while fetching learner report.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Register REST API endpoint for Team Report
 */
add_action('rest_api_init', function () {
    if (!class_exists('SFWD_LMS')) {
        error_log('LearnDash not active, skipping /team-report route.');
        return;
    }

    register_rest_route('custom-api/v1', '/team-report', [
        'methods'             => 'GET',
        'callback'            => 'get_team_report',
        'permission_callback' => 'is_admin_user', // Restrict to admin
    ]);
});

/**
 * Get team report with performance statistics
 */
function get_team_report(WP_REST_Request $request) {
    global $wpdb;

    try {
        // Get query parameters
        $page = max(1, intval($request->get_param('page')) ?: 1);
        $per_page = max(1, min(100, intval($request->get_param('per_page')) ?: 100));
        $search = sanitize_text_field($request->get_param('search') ?: '');

        // Get all published teams (groups)
        $args = [
            'post_type' => 'groups',
            'post_status' => 'publish',
            'posts_per_page' => $per_page,
            'paged' => $page,
            'orderby' => 'title',
            'order' => 'ASC',
        ];

        if ($search) {
            $args['s'] = $search;
        }

        $query = new WP_Query($args);
        $teams_report = [];

        foreach ($query->posts as $group) {
            $group_id = $group->ID;
            $group_name = $group->post_title;
            
            // Skip if search doesn't match
            if ($search && stripos($group_name, $search) === false) {
                continue;
            }

            // Generate initials from team name
            $initials = '';
            $words = explode(' ', $group_name);
            if (count($words) >= 2) {
                $initials = strtoupper(substr($words[0], 0, 1) . substr($words[1], 0, 1));
            } else {
                $initials = strtoupper(substr($group_name, 0, 2));
            }

            // Get group members
            $group_users = [];
            if (function_exists('learndash_get_groups_user_ids')) {
                $group_users = learndash_get_groups_user_ids($group_id);
                if (!is_array($group_users)) {
                    $group_users = [];
                }
            }
            
            $members = count($group_users);

            if ($members === 0) {
                // Team with no members
                $teams_report[] = [
                    'id' => $group_id,
                    'name' => $group_name,
                    'initials' => $initials,
                    'members' => 0,
                    'avgProgress' => 0,
                    'completionRate' => 0,
                ];
                continue;
            }

            // Get courses associated with this team - use multiple fallback methods (same as get_teams_list)
            $group_courses = [];
            
            // Method 1: Use LearnDash function (most common)
            if (function_exists('learndash_get_group_courses')) {
                $group_courses = learndash_get_group_courses($group_id);
                // Ensure it's an array
                if (!is_array($group_courses)) {
                    $group_courses = [];
                }
            }
            
            // Method 2: Try alternative LearnDash function
            if (empty($group_courses) && function_exists('learndash_group_enrolled_courses')) {
                $group_courses = learndash_group_enrolled_courses($group_id);
                if (!is_array($group_courses)) {
                    $group_courses = [];
                }
            }
            
            // Method 3: Get from post meta (LearnDash stores courses here)
            if (empty($group_courses)) {
                $course_ids = get_post_meta($group_id, 'learndash_group_enrolled_courses', true);
                if (is_array($course_ids) && !empty($course_ids)) {
                    $group_courses = $course_ids;
                } elseif (is_numeric($course_ids) && $course_ids > 0) {
                    // Sometimes it's stored as a single ID
                    $group_courses = [$course_ids];
                }
            }
            
            // Method 4: Check for individual course meta keys (from create_team fallback)
            if (empty($group_courses)) {
                $meta_keys = $wpdb->get_col($wpdb->prepare(
                    "SELECT meta_key FROM {$wpdb->postmeta} 
                     WHERE post_id = %d 
                     AND meta_key LIKE 'learndash_group_enrolled_%%'",
                    $group_id
                ));
                
                foreach ($meta_keys as $meta_key) {
                    $course_id = str_replace('learndash_group_enrolled_', '', $meta_key);
                    if (is_numeric($course_id) && $course_id > 0) {
                        $group_courses[] = intval($course_id);
                    }
                }
            }
            
            // Method 5: Try other common meta keys
            if (empty($group_courses)) {
                $meta_keys = [
                    'learndash_group_courses',
                    'ld_group_courses',
                    'group_courses',
                    '_ld_group_courses',
                ];
                foreach ($meta_keys as $meta_key) {
                    $course_ids = get_post_meta($group_id, $meta_key, true);
                    if (is_array($course_ids) && !empty($course_ids)) {
                        $group_courses = $course_ids;
                        break;
                    } elseif (is_numeric($course_ids) && $course_ids > 0) {
                        $group_courses = [$course_ids];
                        break;
                    }
                }
            }

            // Ensure all course IDs are integers
            if (!empty($group_courses)) {
                $group_courses = array_map('intval', $group_courses);
                $group_courses = array_filter($group_courses); // Remove zeros
                $group_courses = array_unique($group_courses); // Remove duplicates
            }

            // Calculate average progress and completion rate
            $avg_progress = 0;
            $completion_rate = 0;

            if (!empty($group_courses)) {
                $total_progress_sum = 0;
                $members_with_progress = 0;
                $completed_members = 0;

                foreach ($group_users as $user_id) {
                    $user_completed_any = false;
                    $user_progress_sum = 0;
                    $user_courses_count = 0;

                    // Check completion and progress for each team course
                    foreach ($group_courses as $course_id) {
                        // Verify course exists and is published
                        $course = get_post($course_id);
                        if (!$course || $course->post_status !== 'publish') {
                            continue;
                        }

                        // Check if user is enrolled in this course
                        $user_enrolled = false;
                        if (function_exists('learndash_user_get_enrolled_courses')) {
                            $user_courses = learndash_user_get_enrolled_courses($user_id, [], true);
                            $user_enrolled = is_array($user_courses) && in_array($course_id, $user_courses);
                        }

                        // Only check progress if user is enrolled
                        if ($user_enrolled) {
                            // Check completion first (most reliable)
                            if (function_exists('learndash_course_completed')) {
                                $is_completed = learndash_course_completed($user_id, $course_id);
                                if ($is_completed) {
                                    $user_completed_any = true;
                                    $user_progress_sum += 100; // Completed = 100%
                                    $user_courses_count++;
                                } else {
                                    // Get progress percentage if not completed
                                    if (function_exists('learndash_course_progress')) {
                                        $progress_data = learndash_course_progress([
                                            'user_id' => $user_id,
                                            'course_id' => $course_id,
                                            'array' => true
                                        ]);
                                        
                                        if (isset($progress_data['percentage']) && is_numeric($progress_data['percentage'])) {
                                            $user_progress_sum += floatval($progress_data['percentage']);
                                            $user_courses_count++;
                                        }
                                    }
                                }
                            } else {
                                // Fallback: Use progress only
                                if (function_exists('learndash_course_progress')) {
                                    $progress_data = learndash_course_progress([
                                        'user_id' => $user_id,
                                        'course_id' => $course_id,
                                        'array' => true
                                    ]);
                                    
                                    if (isset($progress_data['percentage']) && is_numeric($progress_data['percentage'])) {
                                        $progress_percentage = floatval($progress_data['percentage']);
                                        $user_progress_sum += $progress_percentage;
                                        $user_courses_count++;
                                        
                                        // Consider 100% as completed
                                        if ($progress_percentage >= 100) {
                                            $user_completed_any = true;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if ($user_completed_any) {
                        $completed_members++;
                    }

                    // Calculate average progress for this user across team courses
                    if ($user_courses_count > 0) {
                        $total_progress_sum += ($user_progress_sum / $user_courses_count);
                        $members_with_progress++;
                    }
                }

                // Calculate average progress
                if ($members_with_progress > 0) {
                    $avg_progress = round($total_progress_sum / $members_with_progress);
                }

                // Calculate completion rate (percentage of members who completed at least one course)
                if ($members > 0) {
                    $completion_rate = round(($completed_members / $members) * 100);
                }
            } else {
                // If no group courses found, calculate based on all courses that team members are enrolled in
                $all_team_courses = [];
                foreach ($group_users as $user_id) {
                    if (function_exists('learndash_user_get_enrolled_courses')) {
                        $user_courses = learndash_user_get_enrolled_courses($user_id, [], true);
                        if (is_array($user_courses)) {
                            $all_team_courses = array_merge($all_team_courses, $user_courses);
                        }
                    }
                }
                $all_team_courses = array_unique(array_filter($all_team_courses));

                if (!empty($all_team_courses)) {
                    $total_progress_sum = 0;
                    $members_with_progress = 0;
                    $completed_members = 0;

                    foreach ($group_users as $user_id) {
                        $user_completed_any = false;
                        $user_progress_sum = 0;
                        $user_courses_count = 0;

                        foreach ($all_team_courses as $course_id) {
                            $course = get_post($course_id);
                            if (!$course || $course->post_status !== 'publish') {
                                continue;
                            }

                            if (function_exists('learndash_course_completed')) {
                                $is_completed = learndash_course_completed($user_id, $course_id);
                                if ($is_completed) {
                                    $user_completed_any = true;
                                    $user_progress_sum += 100;
                                    $user_courses_count++;
                                } else {
                                    if (function_exists('learndash_course_progress')) {
                                        $progress_data = learndash_course_progress([
                                            'user_id' => $user_id,
                                            'course_id' => $course_id,
                                            'array' => true
                                        ]);
                                        
                                        if (isset($progress_data['percentage']) && is_numeric($progress_data['percentage'])) {
                                            $user_progress_sum += floatval($progress_data['percentage']);
                                            $user_courses_count++;
                                        }
                                    }
                                }
                            }
                        }

                        if ($user_completed_any) {
                            $completed_members++;
                        }

                        if ($user_courses_count > 0) {
                            $total_progress_sum += ($user_progress_sum / $user_courses_count);
                            $members_with_progress++;
                        }
                    }

                    if ($members_with_progress > 0) {
                        $avg_progress = round($total_progress_sum / $members_with_progress);
                    }

                    if ($members > 0) {
                        $completion_rate = round(($completed_members / $members) * 100);
                    }
                }
            }

            $teams_report[] = [
                'id' => $group_id,
                'name' => $group_name,
                'initials' => $initials,
                'members' => $members,
                'avgProgress' => $avg_progress,
                'completionRate' => $completion_rate,
            ];
        }

        // Get total count for pagination
        $total_args = [
            'post_type' => 'groups',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'fields' => 'ids',
        ];

        if ($search) {
            $total_args['s'] = $search;
        }

        $total_query = new WP_Query($total_args);
        $total_teams = $total_query->found_posts;

        return new WP_REST_Response([
            'success' => true,
            'data' => $teams_report,
            'total' => $total_teams,
            'page' => $page,
            'per_page' => $per_page,
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while fetching team report.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Register REST API endpoint for Course Popularity Report
 */
add_action('rest_api_init', function () {
    if (!class_exists('SFWD_LMS')) {
        error_log('LearnDash not active, skipping /course-popularity route.');
        return;
    }

    register_rest_route('custom-api/v1', '/course-popularity', [
        'methods'             => 'GET',
        'callback'            => 'get_course_popularity',
        'permission_callback' => 'is_admin_user',
    ]);
});

/**
 * Get course popularity report with metrics, top courses, and categories
 * Optimized for large datasets using SQL aggregations
 */
function get_course_popularity(WP_REST_Request $request) {
    global $wpdb;

    try {
        // Check if LearnDash activity table exists
        $table = $wpdb->prefix . 'learndash_user_activity';
        $table_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));
        
        if (!$table_exists) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'LearnDash activity table not found.',
            ], 500);
        }

        // Get total published courses count (single query)
        $total_courses = (int) $wpdb->get_var("
            SELECT COUNT(ID)
            FROM {$wpdb->posts}
            WHERE post_type = 'sfwd-courses'
            AND post_status = 'publish'
        ");

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

        $course_stats = $wpdb->get_results($course_stats_query, ARRAY_A);

        // Initialize metrics
        $total_enrollments = 0;
        $total_completion_sum = 0;
        $courses_with_completion = 0;
        $top_courses_data = [];
        $category_stats = [];

        // Get course IDs for batch category lookup
        $course_ids = array_column($course_stats, 'course_id');
        
        // Batch get all course categories in one query
        $category_terms = [];
        if (!empty($course_ids)) {
            $placeholders = implode(',', array_fill(0, count($course_ids), '%d'));
            $category_query = $wpdb->prepare("
                SELECT tr.object_id as course_id, t.name as category_name
                FROM {$wpdb->term_relationships} tr
                INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
                INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
                WHERE tr.object_id IN ($placeholders)
                AND tt.taxonomy = 'ld_course_category'
            ", $course_ids);
            
            $category_results = $wpdb->get_results($category_query, ARRAY_A);
            foreach ($category_results as $cat) {
                if (!isset($category_terms[$cat['course_id']])) {
                    $category_terms[$cat['course_id']] = [];
                }
                $category_terms[$cat['course_id']][] = $cat['category_name'];
            }
        }

        // Process course stats
        foreach ($course_stats as $stat) {
            $course_id = (int) $stat['course_id'];
            $course_name = $stat['course_name'];
            $enrolled_count = (int) $stat['enrolled_count'];
            $completed_count = (int) $stat['completed_count'];

            // Get categories for this course
            $categories = isset($category_terms[$course_id]) && !empty($category_terms[$course_id]) 
                ? $category_terms[$course_id] 
                : ['Uncategorized'];

            $total_enrollments += $enrolled_count;

            // Calculate completion rate for this course
            $course_completion_rate = 0;
            if ($enrolled_count > 0) {
                $course_completion_rate = ($completed_count / $enrolled_count) * 100;
                $total_completion_sum += $course_completion_rate;
                $courses_with_completion++;
            }

            // Add to top courses (we'll sort later, but query already sorted by enrolled_count DESC)
            $top_courses_data[] = [
                'id' => (string) $course_id,
                'name' => $course_name,
                'enrolled' => $enrolled_count,
                'completed' => $completed_count,
                'completionRate' => round($course_completion_rate, 1),
                'rating' => 0, // LearnDash doesn't have built-in ratings, default to 0
            ];

            // Update category stats
            foreach ($categories as $category_name) {
                if (!isset($category_stats[$category_name])) {
                    $category_stats[$category_name] = [
                        'name' => $category_name,
                        'courses' => 0,
                        'enrollments' => 0,
                        'completionSum' => 0,
                        'coursesWithCompletion' => 0,
                    ];
                }
                $category_stats[$category_name]['courses']++;
                $category_stats[$category_name]['enrollments'] += $enrolled_count;
                if ($enrolled_count > 0) {
                    $category_stats[$category_name]['completionSum'] += $course_completion_rate;
                    $category_stats[$category_name]['coursesWithCompletion']++;
                }
            }
        }

        // Calculate average completion rate
        $avg_completion_rate = 0;
        if ($courses_with_completion > 0) {
            $avg_completion_rate = round($total_completion_sum / $courses_with_completion, 1);
        }

        // Get top 10 courses (already sorted by enrollment from SQL query)
        $top_courses = array_slice($top_courses_data, 0, 10);
        foreach ($top_courses as $index => &$course) {
            $course['rank'] = $index + 1;
        }

        // Process category stats
        $category_list = [];
        $category_colors = [
            'bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-pink-500',
            'bg-orange-500', 'bg-purple-500', 'bg-cyan-500', 'bg-red-400',
            'bg-indigo-500', 'bg-teal-500'
        ];
        $color_index = 0;

        foreach ($category_stats as $category) {
            $avg_completion = 0;
            if ($category['coursesWithCompletion'] > 0) {
                $avg_completion = round($category['completionSum'] / $category['coursesWithCompletion'], 1);
            }

            $category_list[] = [
                'name' => $category['name'],
                'color' => $category_colors[$color_index % count($category_colors)],
                'courses' => $category['courses'],
                'enrollments' => $category['enrollments'],
                'avgCompletion' => $avg_completion,
            ];
            $color_index++;
        }

        // Sort categories by enrollments (descending)
        usort($category_list, function($a, $b) {
            return $b['enrollments'] - $a['enrollments'];
        });

        // Build response
        return new WP_REST_Response([
            'success' => true,
            'data' => [
                'metrics' => [
                    'totalCourses' => $total_courses,
                    'totalEnrollments' => $total_enrollments,
                    'avgCompletionRate' => $avg_completion_rate,
                    'avgRating' => 0, // LearnDash doesn't have built-in ratings
                ],
                'topCourses' => $top_courses,
                'categories' => $category_list,
            ],
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while fetching course popularity report.',
            'details' => $e->getMessage(),
        ], 500);
    }
}


/**
 * Register REST API endpoints for Settings
 */
add_action('rest_api_init', function () {
    // General Settings
    register_rest_route('custom-api/v1', '/settings/general', [
        'methods' => 'GET',
        'callback' => 'get_general_settings',
        'permission_callback' => 'is_admin_user',
    ]);
    
    register_rest_route('custom-api/v1', '/settings/general', [
        'methods' => 'PUT',
        'callback' => 'update_general_settings',
        'permission_callback' => 'is_admin_user',
    ]);

    // Course Settings
    register_rest_route('custom-api/v1', '/settings/course', [
        'methods' => 'GET',
        'callback' => 'get_course_settings',
        'permission_callback' => 'is_admin_user',
    ]);
    
    register_rest_route('custom-api/v1', '/settings/course', [
        'methods' => 'PUT',
        'callback' => 'update_course_settings',
        'permission_callback' => 'is_admin_user',
    ]);

    // Security Settings - Login Sessions
    register_rest_route('custom-api/v1', '/sessions', [
        'methods' => 'GET',
        'callback' => 'get_login_sessions',
        'permission_callback' => 'is_authenticated_user',
    ]);
    
    register_rest_route('custom-api/v1', '/sessions/(?P<id>[a-zA-Z0-9_-]+)', [
        'methods' => 'DELETE',
        'callback' => 'delete_login_session',
        'permission_callback' => 'is_authenticated_user',
    ]);
    
    register_rest_route('custom-api/v1', '/sessions/logout-all', [
        'methods' => 'POST',
        'callback' => 'logout_all_sessions',
        'permission_callback' => 'is_authenticated_user',
    ]);
});

/**
 * Get General Settings
 * Only returns settings for the currently logged-in admin
 */
function get_general_settings(WP_REST_Request $request) {
    try {
        // Authenticate user from JWT token or WordPress session and set as current user
        $current_user_id = authenticate_and_set_current_user();
        if (!$current_user_id || $current_user_id === 0) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        // Security: Verify user is administrator
        if (!current_user_can('administrator')) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Insufficient permissions. Administrator access required.',
            ], 403);
        }

        $current_user = get_userdata($current_user_id);
        if (!$current_user) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }
        
        // Get the currently logged-in admin's email
        $current_admin_email = $current_user->user_email;
        
        // Get timezone - use custom setting if set, otherwise use WordPress site default
        // WordPress get_option returns false if option doesn't exist, or the value if it does
        $custom_timezone = get_option('akf_timezone', false);
        $wp_timezone = get_option('timezone_string', false);
        
        // If custom timezone is set and not empty, use it
        if ($custom_timezone !== false && !empty($custom_timezone) && trim($custom_timezone) !== '') {
            $timezone = $custom_timezone;
        } else {
            // Use WordPress default timezone
            if ($wp_timezone !== false && !empty($wp_timezone) && trim($wp_timezone) !== '') {
                $timezone = $wp_timezone;
            } else {
                // If timezone_string is empty, WordPress might be using UTC offset
                $gmt_offset = get_option('gmt_offset', 0);
                if ($gmt_offset != 0) {
                    $timezone = 'UTC' . ($gmt_offset >= 0 ? '+' : '') . number_format($gmt_offset, 1);
                } else {
                    $timezone = 'UTC';
                }
            }
        }
        
        // Get date format - use custom setting if set, otherwise use WordPress site default
        $custom_date_format = get_option('akf_date_format', false);
        $wp_date_format = get_option('date_format', 'm/d/Y');
        
        // If custom date format is set and not empty, use it
        if ($custom_date_format !== false && !empty($custom_date_format) && trim($custom_date_format) !== '') {
            $date_format = $custom_date_format;
        } else {
            // Use WordPress default date format
            $date_format = !empty($wp_date_format) && trim($wp_date_format) !== '' ? $wp_date_format : 'm/d/Y';
        }
        
        // Get language - use custom setting if set, otherwise use WordPress site default
        $custom_language = get_option('akf_default_language', false);
        $wp_language = get_option('WPLANG', '');
        
        // If custom language is set and not empty, use it
        if ($custom_language !== false && !empty($custom_language) && trim($custom_language) !== '') {
            $language = $custom_language;
        } else {
            // Use WordPress default language
            $language = !empty($wp_language) && trim($wp_language) !== '' ? $wp_language : 'en';
        }
        
        $settings = [
            'organisationName' => get_option('akf_organisation_name', 'Aga Khan Foundation'),
            'adminEmail' => $current_admin_email, // Return currently logged-in admin's email only
            'timezone' => $timezone,
            'dateFormat' => $date_format,
            'language' => $language,
            'profilePicture' => get_user_meta($current_user_id, 'akf_profile_picture', true) ?: null,
        ];

        return new WP_REST_Response([
            'success' => true,
            'data' => $settings,
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while fetching general settings.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Update General Settings
 * Only allows the currently logged-in admin to update their own settings
 */
function update_general_settings(WP_REST_Request $request) {
    try {
        // Authenticate user from JWT token or WordPress session and set as current user
        $current_user_id = authenticate_and_set_current_user();
        if (!$current_user_id || $current_user_id === 0) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        // Security: Verify user is administrator
        if (!current_user_can('administrator')) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Insufficient permissions. Administrator access required.',
            ], 403);
        }

        $current_user = get_userdata($current_user_id);
        if (!$current_user) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        $params = $request->get_json_params();
        $updated_fields = [];

        // Security: Reject any attempt to pass user ID in request
        if (isset($params['userId']) || isset($params['user_id']) || isset($params['ID'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Cannot modify user ID. You can only update your own settings.',
            ], 403);
        }

        // Update Organisation Name
        if (isset($params['organisationName'])) {
            $org_name = sanitize_text_field($params['organisationName']);
            update_option('akf_organisation_name', $org_name);
            $updated_fields[] = 'organisationName';
        }

        // Update Administrator Email (update the currently logged-in user's email)
        if (isset($params['adminEmail'])) {
            $admin_email = sanitize_email($params['adminEmail']);
            if (!is_email($admin_email)) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Invalid email address.',
                ], 400);
            }
            
            // Check if email is already in use by another user
            $email_exists = email_exists($admin_email);
            if ($email_exists && $email_exists != $current_user_id) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'This email is already registered to another user.',
                ], 400);
            }
            
            // Update the current user's email
            $user_data = [
                'ID' => $current_user_id,
                'user_email' => $admin_email,
            ];
            $result = wp_update_user($user_data);
            
            if (is_wp_error($result)) {
                return new WP_REST_Response([
                    'success' => false,
                    'message' => 'Failed to update email: ' . $result->get_error_message(),
                ], 500);
            }
            
            $updated_fields[] = 'adminEmail';
        }

        // Update Timezone (only if explicitly provided and not empty)
        if (isset($params['timezone']) && $params['timezone'] !== null && $params['timezone'] !== '') {
            $timezone = sanitize_text_field($params['timezone']);
            update_option('akf_timezone', $timezone);
            // Also update WordPress site timezone (for entire website)
            update_option('timezone_string', $timezone);
            $updated_fields[] = 'timezone';
        }

        // Update Date Format (only if explicitly provided and not empty)
        if (isset($params['dateFormat']) && $params['dateFormat'] !== null && $params['dateFormat'] !== '') {
            $date_format = sanitize_text_field($params['dateFormat']);
            update_option('akf_date_format', $date_format);
            // Map to WordPress date format and update WordPress site default
            $wp_date_format = $date_format;
            if ($date_format === 'us') {
                $wp_date_format = 'm/d/Y';
            } elseif ($date_format === 'eu') {
                $wp_date_format = 'd/m/Y';
            } elseif ($date_format === 'iso') {
                $wp_date_format = 'Y-m-d';
            } elseif ($date_format === 'long') {
                $wp_date_format = 'F j, Y';
            }
            update_option('date_format', $wp_date_format);
            $updated_fields[] = 'dateFormat';
        }

        // Update Default Language (only if explicitly provided and not empty)
        if (isset($params['language']) && $params['language'] !== null && $params['language'] !== '') {
            $language = sanitize_text_field($params['language']);
            update_option('akf_default_language', $language);
            // Map to WordPress language code and update WordPress site default
            $wp_lang = 'en';
            $lang_map = [
                'english' => 'en',
                'spanish' => 'es',
                'french' => 'fr',
                'german' => 'de',
                'chinese' => 'zh_CN',
                'arabic' => 'ar',
            ];
            if (isset($lang_map[$language])) {
                $wp_lang = $lang_map[$language];
            }
            update_option('WPLANG', $wp_lang);
            $updated_fields[] = 'language';
        }

        // Update Profile Picture
        if (isset($params['profilePicture'])) {
            if ($params['profilePicture'] === null || $params['profilePicture'] === '') {
                delete_user_meta($current_user_id, 'akf_profile_picture');
            } else {
                // If it's a base64 image, handle upload
                if (strpos($params['profilePicture'], 'data:image') === 0) {
                    $image_data = $params['profilePicture'];
                    $upload_result = handle_base64_image_upload($image_data, $current_user_id);
                    if ($upload_result['success']) {
                        update_user_meta($current_user_id, 'akf_profile_picture', $upload_result['url']);
                        $updated_fields[] = 'profilePicture';
                    } else {
                        return new WP_REST_Response([
                            'success' => false,
                            'message' => $upload_result['message'],
                        ], 400);
                    }
                } else {
                    // It's already a URL
                    update_user_meta($current_user_id, 'akf_profile_picture', esc_url_raw($params['profilePicture']));
                    $updated_fields[] = 'profilePicture';
                }
            }
        }

        // Get updated settings (only for current user)
        $updated_user = get_userdata($current_user_id);
        if (!$updated_user) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Failed to retrieve updated user data.',
            ], 500);
        }

        // Get timezone - use custom setting if set, otherwise use WordPress site default
        // WordPress get_option returns false if option doesn't exist, or the value if it does
        $custom_timezone = get_option('akf_timezone', false);
        $wp_timezone = get_option('timezone_string', false);
        
        // If custom timezone is set and not empty, use it
        if ($custom_timezone !== false && !empty($custom_timezone) && trim($custom_timezone) !== '') {
            $timezone = $custom_timezone;
        } else {
            // Use WordPress default timezone
            if ($wp_timezone !== false && !empty($wp_timezone) && trim($wp_timezone) !== '') {
                $timezone = $wp_timezone;
            } else {
                // If timezone_string is empty, WordPress might be using UTC offset
                $gmt_offset = get_option('gmt_offset', 0);
                if ($gmt_offset != 0) {
                    $timezone = 'UTC' . ($gmt_offset >= 0 ? '+' : '') . number_format($gmt_offset, 1);
                } else {
                    $timezone = 'UTC';
                }
            }
        }
        
        // Get date format - use custom setting if set, otherwise use WordPress site default
        $custom_date_format = get_option('akf_date_format', false);
        $wp_date_format = get_option('date_format', 'm/d/Y');
        
        // If custom date format is set and not empty, use it
        if ($custom_date_format !== false && !empty($custom_date_format) && trim($custom_date_format) !== '') {
            $date_format = $custom_date_format;
        } else {
            // Use WordPress default date format
            $date_format = !empty($wp_date_format) && trim($wp_date_format) !== '' ? $wp_date_format : 'm/d/Y';
        }
        
        // Get language - use custom setting if set, otherwise use WordPress site default
        $custom_language = get_option('akf_default_language', false);
        $wp_language = get_option('WPLANG', '');
        
        // If custom language is set and not empty, use it
        if ($custom_language !== false && !empty($custom_language) && trim($custom_language) !== '') {
            $language = $custom_language;
        } else {
            // Use WordPress default language
            $language = !empty($wp_language) && trim($wp_language) !== '' ? $wp_language : 'en';
        }
        
        $updated_settings = [
            'organisationName' => get_option('akf_organisation_name', 'Aga Khan Foundation'),
            'adminEmail' => $updated_user->user_email, // Only current user's email
            'timezone' => $timezone,
            'dateFormat' => $date_format,
            'language' => $language,
            'profilePicture' => get_user_meta($current_user_id, 'akf_profile_picture', true) ?: null,
        ];

        return new WP_REST_Response([
            'success' => true,
            'message' => 'General settings updated successfully.',
            'data' => $updated_settings,
            'updated_fields' => $updated_fields,
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while updating general settings.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Handle base64 image upload
 */
function handle_base64_image_upload($base64_image, $user_id) {
    // Extract image data
    if (preg_match('/data:image\/(\w+);base64,(.+)/', $base64_image, $matches)) {
        $image_type = $matches[1];
        $image_data = base64_decode($matches[2]);
        
        // Validate image type
        $allowed_types = ['jpeg', 'jpg', 'png', 'gif'];
        if (!in_array(strtolower($image_type), $allowed_types)) {
            return ['success' => false, 'message' => 'Invalid image type. Only JPEG, PNG, and GIF are allowed.'];
        }
        
        // Validate file size (max 5MB)
        if (strlen($image_data) > 5 * 1024 * 1024) {
            return ['success' => false, 'message' => 'Image size exceeds 5MB limit.'];
        }
        
        // Create upload directory if it doesn't exist
        $upload_dir = wp_upload_dir();
        $profile_dir = $upload_dir['basedir'] . '/profile-pictures';
        if (!file_exists($profile_dir)) {
            wp_mkdir_p($profile_dir);
        }
        
        // Generate unique filename
        $filename = 'profile-' . $user_id . '-' . time() . '.' . $image_type;
        $file_path = $profile_dir . '/' . $filename;
        
        // Save file
        if (file_put_contents($file_path, $image_data)) {
            $file_url = $upload_dir['baseurl'] . '/profile-pictures/' . $filename;
            return ['success' => true, 'url' => $file_url];
        } else {
            return ['success' => false, 'message' => 'Failed to save image file.'];
        }
    }
    
    return ['success' => false, 'message' => 'Invalid image data format.'];
}

/**
 * Get Course Settings
 */
function get_course_settings(WP_REST_Request $request) {
    try {
        $settings = [
            'certificateGeneration' => get_option('akf_certificate_generation', true),
            'cpdCertificateGeneration' => get_option('akf_cpd_certificate_generation', true),
            'quizRetakes' => get_option('akf_quiz_retakes', '3'),
            'passingScore' => get_option('akf_passing_score', '70'),
            'courseExpiry' => get_option('akf_course_expiry', '365'),
        ];

        return new WP_REST_Response([
            'success' => true,
            'data' => $settings,
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while fetching course settings.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Update Course Settings
 * Only accessible by logged-in admin
 */
function update_course_settings(WP_REST_Request $request) {
    try {
        // Authenticate user from JWT token or WordPress session and set as current user
        $current_user_id = authenticate_and_set_current_user();
        if (!$current_user_id || $current_user_id === 0) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        // Security: Verify user is administrator
        if (!current_user_can('administrator')) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Insufficient permissions. Administrator access required.',
            ], 403);
        }

        $params = $request->get_json_params();
        $updated_fields = [];

        // Security: Reject any attempt to pass user ID in request
        if (isset($params['userId']) || isset($params['user_id']) || isset($params['ID'])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Cannot modify user ID. You can only update settings.',
            ], 403);
        }

        // Update Certificate Generation
        if (isset($params['certificateGeneration'])) {
            $value = (bool) $params['certificateGeneration'];
            update_option('akf_certificate_generation', $value);
            $updated_fields[] = 'certificateGeneration';
        }

        // Update CPD Certificate Generation
        if (isset($params['cpdCertificateGeneration'])) {
            $value = (bool) $params['cpdCertificateGeneration'];
            update_option('akf_cpd_certificate_generation', $value);
            $updated_fields[] = 'cpdCertificateGeneration';
        }

        // Update Quiz Retakes
        if (isset($params['quizRetakes'])) {
            $value = max(0, intval($params['quizRetakes']));
            update_option('akf_quiz_retakes', $value);
            $updated_fields[] = 'quizRetakes';
        }

        // Update Passing Score
        if (isset($params['passingScore'])) {
            $value = max(0, min(100, intval($params['passingScore'])));
            update_option('akf_passing_score', $value);
            $updated_fields[] = 'passingScore';
        }

        // Update Course Expiry
        if (isset($params['courseExpiry'])) {
            $value = max(0, intval($params['courseExpiry']));
            update_option('akf_course_expiry', $value);
            $updated_fields[] = 'courseExpiry';
        }

        // Get updated settings
        $updated_settings = [
            'certificateGeneration' => get_option('akf_certificate_generation', true),
            'cpdCertificateGeneration' => get_option('akf_cpd_certificate_generation', true),
            'quizRetakes' => get_option('akf_quiz_retakes', '3'),
            'passingScore' => get_option('akf_passing_score', '70'),
            'courseExpiry' => get_option('akf_course_expiry', '365'),
        ];

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Course settings updated successfully.',
            'data' => $updated_settings,
            'updated_fields' => $updated_fields,
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while updating course settings.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Get Login Sessions
 */
function get_login_sessions(WP_REST_Request $request) {
    try {
        // Authenticate user from JWT token or WordPress session and set as current user
        $current_user_id = authenticate_and_set_current_user();
        if (!$current_user_id || $current_user_id === 0) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }
        
        $sessions = get_user_meta($current_user_id, 'akf_login_sessions', true);
        
        if (!is_array($sessions)) {
            $sessions = [];
        }

        // Get current session token
        $current_token = wp_get_session_token();
        
        // Format sessions for response
        $formatted_sessions = [];
        foreach ($sessions as $session_id => $session_data) {
            $is_current = ($session_data['token'] === $current_token);
            
            $formatted_sessions[] = [
                'id' => $session_id,
                'device' => $session_data['device'] ?? 'Unknown Device',
                'deviceType' => $session_data['deviceType'] ?? 'desktop',
                'ipAddress' => $session_data['ipAddress'] ?? 'Unknown',
                'isCurrent' => $is_current,
                'lastActive' => $session_data['lastActive'] ?? 'Unknown',
            ];
        }

        // Sort: current session first, then by last active
        usort($formatted_sessions, function($a, $b) {
            if ($a['isCurrent']) return -1;
            if ($b['isCurrent']) return 1;
            return strtotime($b['lastActive']) - strtotime($a['lastActive']);
        });

        return new WP_REST_Response([
            'success' => true,
            'data' => $formatted_sessions,
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while fetching login sessions.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Delete Login Session
 * Only allows deleting sessions for the currently logged-in user
 */
function delete_login_session(WP_REST_Request $request) {
    try {
        // Authenticate user from JWT token or WordPress session and set as current user
        $current_user_id = authenticate_and_set_current_user();
        if (!$current_user_id || $current_user_id === 0) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        $session_id = $request->get_param('id');
        
        if (empty($session_id)) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Session ID is required.',
            ], 400);
        }
        
        $sessions = get_user_meta($current_user_id, 'akf_login_sessions', true);
        
        if (!is_array($sessions)) {
            $sessions = [];
        }

        if (!isset($sessions[$session_id])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Session not found.',
            ], 404);
        }

        // Security: Verify session belongs to current user
        if (!isset($sessions[$session_id])) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Session not found or does not belong to you.',
            ], 404);
        }

        // Don't allow deleting current session
        $current_token = wp_get_session_token();
        if (isset($sessions[$session_id]['token']) && $sessions[$session_id]['token'] === $current_token) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'Cannot delete current session.',
            ], 400);
        }

        // Store token before deleting session
        $session_token = $sessions[$session_id]['token'] ?? '';

        // Delete the session
        unset($sessions[$session_id]);
        update_user_meta($current_user_id, 'akf_login_sessions', $sessions);

        // Invalidate the session token in WordPress (only if token exists)
        if (!empty($session_token)) {
            $session_manager = WP_Session_Tokens::get_instance($current_user_id);
            $session_manager->destroy($session_token);
        }

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Session logged out successfully.',
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while deleting session.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Logout All Sessions
 * Only allows logging out sessions for the currently logged-in user
 */
function logout_all_sessions(WP_REST_Request $request) {
    try {
        // Authenticate user from JWT token or WordPress session and set as current user
        $current_user_id = authenticate_and_set_current_user();
        if (!$current_user_id || $current_user_id === 0) {
            return new WP_REST_Response([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        $current_token = wp_get_session_token();
        
        $sessions = get_user_meta($current_user_id, 'akf_login_sessions', true);
        
        if (!is_array($sessions)) {
            $sessions = [];
        }

        // Keep only current session
        $current_session = null;
        foreach ($sessions as $session_id => $session_data) {
            if ($session_data['token'] === $current_token) {
                $current_session = [$session_id => $session_data];
                break;
            }
        }

        // Destroy all other sessions
        $session_manager = WP_Session_Tokens::get_instance($current_user_id);
        foreach ($sessions as $session_id => $session_data) {
            if ($session_data['token'] !== $current_token) {
                $session_manager->destroy($session_data['token']);
            }
        }

        // Update user meta to keep only current session
        update_user_meta($current_user_id, 'akf_login_sessions', $current_session ?: []);

        return new WP_REST_Response([
            'success' => true,
            'message' => 'All other sessions have been logged out.',
        ], 200);

    } catch (Exception $e) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'An error occurred while logging out sessions.',
            'details' => $e->getMessage(),
        ], 500);
    }
}

/**
 * Track login sessions (hook into WordPress login)
 */
add_action('wp_login', 'track_user_login_session', 10, 2);
function track_user_login_session($user_login, $user) {
    $user_id = $user->ID;
    $sessions = get_user_meta($user_id, 'akf_login_sessions', true);
    
    if (!is_array($sessions)) {
        $sessions = [];
    }

    // Get current session token
    $session_manager = WP_Session_Tokens::get_instance($user_id);
    $token = wp_get_session_token();
    
    // Detect device info
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $device = detect_device_from_user_agent($user_agent);
    $device_type = detect_device_type_from_user_agent($user_agent);
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';

    // Create session entry
    $session_id = wp_generate_password(32, false);
    $sessions[$session_id] = [
        'token' => $token,
        'device' => $device,
        'deviceType' => $device_type,
        'ipAddress' => $ip_address,
        'lastActive' => current_time('mysql'),
        'created' => current_time('mysql'),
    ];

    // Keep only last 10 sessions
    if (count($sessions) > 10) {
        // Remove oldest sessions
        uasort($sessions, function($a, $b) {
            return strtotime($a['created']) - strtotime($b['created']);
        });
        $sessions = array_slice($sessions, -10, 10, true);
    }

    update_user_meta($user_id, 'akf_login_sessions', $sessions);
}

/**
 * Detect device from user agent
 */
function detect_device_from_user_agent($user_agent) {
    if (stripos($user_agent, 'Chrome') !== false) {
        $os = 'Windows';
        if (stripos($user_agent, 'Mac') !== false) $os = 'Mac';
        if (stripos($user_agent, 'Linux') !== false) $os = 'Linux';
        return "Chrome on $os";
    } elseif (stripos($user_agent, 'Safari') !== false && stripos($user_agent, 'Chrome') === false) {
        if (stripos($user_agent, 'iPhone') !== false || stripos($user_agent, 'iPad') !== false) {
            $device = stripos($user_agent, 'iPhone') !== false ? 'iPhone' : 'iPad';
            return "Safari on $device";
        }
        return "Safari on Mac";
    } elseif (stripos($user_agent, 'Firefox') !== false) {
        $os = 'Windows';
        if (stripos($user_agent, 'Mac') !== false) $os = 'Mac';
        if (stripos($user_agent, 'Linux') !== false) $os = 'Linux';
        return "Firefox on $os";
    } elseif (stripos($user_agent, 'Edge') !== false) {
        return "Edge on Windows";
    }
    
    return 'Unknown Device';
}

/**
 * Detect device type from user agent
 */
function detect_device_type_from_user_agent($user_agent) {
    if (stripos($user_agent, 'Mobile') !== false || 
        stripos($user_agent, 'iPhone') !== false || 
        stripos($user_agent, 'Android') !== false) {
        return 'mobile';
    }
    return 'desktop';
}

/**
 * Check if user is authenticated via JWT or WordPress session
 */
function is_authenticated_user() {
    // Check JWT token first
    $token = JWT_Manager::get_token_from_header();
    
    if ($token) {
        $payload = JWT_Manager::verify_token($token);
        return $payload !== false;
    }
    
    // Fallback to WordPress session
    return is_user_logged_in();
}

/**
 * Allow only admin users
 */
/**
 * Check if user is authenticated via JWT or WordPress session and is an administrator
 */
function is_admin_user() {
    // Check JWT token first
    $token = JWT_Manager::get_token_from_header();
    
    if ($token) {
        $payload = JWT_Manager::verify_token($token);
        
        if ($payload && isset($payload['data']['user']['roles'])) {
            $roles = $payload['data']['user']['roles'];
            // Check if user has administrator role
            if (in_array('administrator', $roles)) {
                return true;
            }
        }
        
        // If token verification failed or user doesn't have admin role,
        // fall through to WordPress session check
    }
    
    // Fallback to WordPress session
    return current_user_can('administrator');
}

/**
 * Get current user from JWT or WordPress session
 * Returns user object or false
 */
function get_current_auth_user() {
    // Check JWT token first
    $token = JWT_Manager::get_token_from_header();
    
    if ($token) {
        $payload = JWT_Manager::verify_token($token);
        
        if ($payload && isset($payload['data']['user']['id'])) {
            $user_id = $payload['data']['user']['id'];
            return get_userdata($user_id);
        }
    }
    
    // Fallback to WordPress session
    if (is_user_logged_in()) {
        return wp_get_current_user();
    }
    
    return false;
}

/**
 * Authenticate user from JWT token and set as current user
 * This allows WordPress functions like get_current_user_id() and current_user_can() to work with JWT
 * Returns user ID if authenticated, false otherwise
 */
function authenticate_and_set_current_user() {
    // Check JWT token first
    $token = JWT_Manager::get_token_from_header();
    
    if ($token) {
        $payload = JWT_Manager::verify_token($token);
        
        if ($payload && isset($payload['data']['user']['id'])) {
            $user_id = $payload['data']['user']['id'];
            $user = get_userdata($user_id);
            
            if ($user) {
                // Set the current user so WordPress functions work
                wp_set_current_user($user_id);
                return $user_id;
            }
        }
    }
    
    // Fallback to WordPress session
    if (is_user_logged_in()) {
        return get_current_user_id();
    }
    
    return false;
}

/**
 * Authenticate WordPress core REST API endpoints with JWT tokens
 * This makes endpoints like /wp/v2/users/me work with JWT authentication
 */
add_filter('rest_authentication_errors', function($result) {
    // If authentication already succeeded, don't override it
    if (!empty($result)) {
        return $result;
    }
    
    // Try to authenticate from JWT token
    $user_id = authenticate_and_set_current_user();
    
    if ($user_id) {
        // Authentication successful, return null to allow the request
        return null;
    }
    
    // No authentication found, let WordPress handle it normally
    // (this allows cookie-based auth to still work)
    return $result;
}, 20);

/**
 * Modify WordPress core user REST API response to include custom profile picture
 * This makes the avatar_urls use the custom akf_profile_picture if available
 */
add_filter('rest_prepare_user', function($response, $user, $request) {
    // Only modify for /wp/v2/users/me endpoint
    if ($request->get_route() === '/wp/v2/users/me') {
        // Get custom profile picture
        $custom_profile_picture = get_user_meta($user->ID, 'akf_profile_picture', true);
        
        if (!empty($custom_profile_picture)) {
            // Use custom profile picture for all avatar sizes
            $avatar_urls = [
                '24' => $custom_profile_picture,
                '48' => $custom_profile_picture,
                '96' => $custom_profile_picture,
            ];
            
            // Update the response data
            $data = $response->get_data();
            $data['avatar_urls'] = $avatar_urls;
            $response->set_data($data);
        }
    }
    
    return $response;
}, 10, 3);

/**
 * ============================================================================
 * SSO AUTHENTICATION SYSTEM
 * ============================================================================
 * Secure JWT-based Single Sign-On for WordPress to Dashboard integration
 */

/**
 * Secure JWT Manager with Token Revocation & Logging
 */
class JWT_Manager {
    private static $secret_key = null;
    private static $algorithm = 'sha256';
    
    /**
     * Get or generate JWT secret key
     */
    private static function get_secret_key() {
        if (self::$secret_key !== null) {
            return self::$secret_key;
        }
        
        if (defined('AUTH_KEY') && defined('SECURE_AUTH_KEY')) {
            self::$secret_key = hash('sha256', AUTH_KEY . SECURE_AUTH_KEY);
        } else {
            $secret = get_option('akf_jwt_secret_key');
            if (!$secret) {
                $secret = bin2hex(random_bytes(32));
                update_option('akf_jwt_secret_key', $secret);
            }
            self::$secret_key = $secret;
        }
        
        return self::$secret_key;
    }
    
    private static function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64url_decode($data) {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }
    
    /**
     * Generate JWT token for user
     */
    public static function generate_token($user, $expiration = null) {
        if (!$user || !$user->ID) {
            self::log_error('Token generation failed: Invalid user');
            return false;
        }
        
        $issued_at = time();
        $not_before = $issued_at;
        $expire = $expiration ?? ($issued_at + (HOUR_IN_SECONDS * 2)); // 2 hours
        
        // Generate unique token ID for revocation support
        $token_id = bin2hex(random_bytes(16));
        
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256',
        ];
        
        $payload = [
            'iss' => get_bloginfo('url'),
            'aud' => get_bloginfo('url'),
            'iat' => $issued_at,
            'nbf' => $not_before,
            'exp' => $expire,
            'jti' => $token_id,
            'data' => [
                'user' => [
                    'id' => $user->ID,
                    'email' => $user->user_email,
                    'username' => $user->user_login,
                    'display_name' => $user->display_name,
                    'roles' => $user->roles,
                ],
            ],
        ];
        
        $header_encoded = self::base64url_encode(json_encode($header));
        $payload_encoded = self::base64url_encode(json_encode($payload));
        
        $signature = hash_hmac(
            self::$algorithm,
            $header_encoded . '.' . $payload_encoded,
            self::get_secret_key(),
            true
        );
        $signature_encoded = self::base64url_encode($signature);
        
        $jwt = $header_encoded . '.' . $payload_encoded . '.' . $signature_encoded;
        
        // Store token ID for revocation support
        self::store_token_id($user->ID, $token_id, $expire);
        
        self::log_info("JWT generated for user {$user->ID} (expires: " . date('Y-m-d H:i:s', $expire) . ")");
        
        return $jwt;
    }
    
    /**
     * Verify and decode JWT token
     */
    public static function verify_token($token) {
        if (empty($token)) {
            self::log_error('Token verification failed: Empty token');
            return false;
        }
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            self::log_error('Token verification failed: Invalid format');
            return false;
        }
        
        list($header_encoded, $payload_encoded, $signature_encoded) = $parts;
        
        $signature = self::base64url_decode($signature_encoded);
        if ($signature === false) {
            self::log_error('Token verification failed: Invalid signature encoding');
            return false;
        }
        
        // Timing-attack safe signature verification
        $expected_signature = hash_hmac(
            self::$algorithm,
            $header_encoded . '.' . $payload_encoded,
            self::get_secret_key(),
            true
        );
        
        if (!hash_equals($expected_signature, $signature)) {
            self::log_error('Token verification failed: Signature mismatch');
            return false;
        }
        
        $payload = json_decode(self::base64url_decode($payload_encoded), true);
        
        if (!$payload) {
            self::log_error('Token verification failed: Invalid payload');
            return false;
        }
        
        $current_time = time();
        
        // Check expiration
        if (isset($payload['exp']) && $payload['exp'] < $current_time) {
            self::log_error('Token verification failed: Expired token');
            return false;
        }
        
        // Check not-before
        if (isset($payload['nbf']) && $payload['nbf'] > $current_time) {
            self::log_error('Token verification failed: Token not yet valid');
            return false;
        }
        
        // Check issuer
        if (isset($payload['iss']) && $payload['iss'] !== get_bloginfo('url')) {
            self::log_error('Token verification failed: Invalid issuer');
            return false;
        }
        
        // Check if token is revoked
        if (isset($payload['jti']) && isset($payload['data']['user']['id'])) {
            if (self::is_token_revoked($payload['data']['user']['id'], $payload['jti'])) {
                self::log_error('Token verification failed: Token revoked (user: ' . $payload['data']['user']['id'] . ')');
                return false;
            }
        }
        
        return $payload;
    }
    
    /**
     * Store token ID for revocation support
     */
    private static function store_token_id($user_id, $token_id, $expiration) {
        $tokens = get_user_meta($user_id, 'akf_active_jwt_tokens', true);
        if (!is_array($tokens)) {
            $tokens = [];
        }
        
        // Clean up expired tokens
        $tokens = array_filter($tokens, function($token) {
            return $token['exp'] > time();
        });
        
        $tokens[$token_id] = [
            'exp' => $expiration,
            'created' => time(),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        ];
        
        // Keep only last 10 tokens per user
        if (count($tokens) > 10) {
            uasort($tokens, function($a, $b) {
                return $a['created'] - $b['created'];
            });
            $tokens = array_slice($tokens, -10, 10, true);
        }
        
        update_user_meta($user_id, 'akf_active_jwt_tokens', $tokens);
    }
    
    /**
     * Check if token is revoked
     */
    private static function is_token_revoked($user_id, $token_id) {
        $tokens = get_user_meta($user_id, 'akf_active_jwt_tokens', true);
        if (!is_array($tokens)) {
            return true;
        }
        
        return !isset($tokens[$token_id]);
    }
    
    /**
     * Revoke a specific token
     */
    public static function revoke_token($user_id, $token_id) {
        $tokens = get_user_meta($user_id, 'akf_active_jwt_tokens', true);
        if (!is_array($tokens)) {
            return false;
        }
        
        if (isset($tokens[$token_id])) {
            unset($tokens[$token_id]);
            update_user_meta($user_id, 'akf_active_jwt_tokens', $tokens);
            self::log_info("Token revoked for user {$user_id}: {$token_id}");
            return true;
        }
        
        return false;
    }
    
    /**
     * Revoke all tokens for a user
     */
    public static function revoke_all_tokens($user_id) {
        $result = delete_user_meta($user_id, 'akf_active_jwt_tokens');
        self::log_info("All tokens revoked for user {$user_id}");
        return $result;
    }
    
    /**
     * Extract token from Authorization header
     */
    public static function get_token_from_header() {
        $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        
        if (empty($auth_header)) {
            $auth_header = isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) ? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] : '';
        }
        
        if (empty($auth_header)) {
            return false;
        }
        
        list($type, $token) = array_pad(explode(' ', $auth_header, 2), 2, null);
        
        if (strcasecmp($type, 'Bearer') !== 0 || empty($token)) {
            return false;
        }
        
        return $token;
    }
    
    /**
     * Log error message
     */
    private static function log_error($message) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('[JWT_Manager ERROR] ' . $message);
        }
    }
    
    /**
     * Log info message
     */
    private static function log_info($message) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('[JWT_Manager INFO] ' . $message);
        }
    }
}

/**
 * Rate Limiter for API endpoints
 */
class Rate_Limiter {
    /**
     * Check if request is rate limited
     */
    public static function check($identifier, $action, $max_attempts = 5, $time_window = 300) {
        $key = 'rate_limit_' . $action . '_' . md5($identifier);
        $attempts = get_transient($key);
        
        if ($attempts === false) {
            set_transient($key, 1, $time_window);
            return [
                'allowed' => true,
                'remaining' => $max_attempts - 1,
                'reset_at' => time() + $time_window,
            ];
        }
        
        $attempts = intval($attempts);
        
        if ($attempts >= $max_attempts) {
            self::log_rate_limit($identifier, $action);
            return [
                'allowed' => false,
                'remaining' => 0,
                'reset_at' => time() + $time_window,
            ];
        }
        
        set_transient($key, $attempts + 1, $time_window);
        
        return [
            'allowed' => true,
            'remaining' => $max_attempts - ($attempts + 1),
            'reset_at' => time() + $time_window,
        ];
    }
    
    /**
     * Reset rate limit for an identifier
     */
    public static function reset($identifier, $action) {
        $key = 'rate_limit_' . $action . '_' . md5($identifier);
        delete_transient($key);
    }
    
    /**
     * Log rate limit violation
     */
    private static function log_rate_limit($identifier, $action) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        error_log(sprintf(
            '[RATE_LIMIT] Action: %s, Identifier: %s, IP: %s, User-Agent: %s',
            $action,
            $identifier,
            $ip,
            $user_agent
        ));
    }
}

/**
 * Secure SSO Authentication Endpoint
 */
class SSO_Endpoint {
    public static function register() {
        register_rest_route('custom-api/v1', '/auth/generate-sso-token', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'generate_sso_token'],
            'permission_callback' => 'is_user_logged_in',
        ]);
        
        register_rest_route('custom-api/v1', '/auth/exchange-token', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'exchange_token'],
            'permission_callback' => '__return_true',
        ]);
        
        register_rest_route('custom-api/v1', '/auth/validate', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'validate_token'],
            'permission_callback' => '__return_true',
        ]);
        
        register_rest_route('custom-api/v1', '/auth/refresh', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'refresh_token'],
            'permission_callback' => '__return_true',
        ]);
        
        register_rest_route('custom-api/v1', '/auth/revoke', [
            'methods'  => 'POST',
            'callback' => [__CLASS__, 'revoke_token'],
            'permission_callback' => '__return_true',
        ]);
    }
    
    /**
     * Generate one-time SSO token
     */
    public static function generate_sso_token($request) {
        $user_id = get_current_user_id();
        
        if (!$user_id) {
            self::log_error('SSO token generation failed: User not logged in');
            return new WP_Error('unauthorized', 'User not logged in', ['status' => 401]);
        }
        
        // Rate limiting
        $rate_check = Rate_Limiter::check($user_id, 'sso_generate', 10, 300);
        if (!$rate_check['allowed']) {
            self::log_error("SSO token generation rate limited for user {$user_id}");
            return new WP_Error('rate_limit_exceeded', 'Too many requests. Please try again later.', [
                'status' => 429,
                'reset_at' => $rate_check['reset_at'],
            ]);
        }
        
        $token = bin2hex(random_bytes(32));
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        set_transient('sso_token_' . $token, [
            'user_id' => $user_id,
            'created_at' => time(),
            'ip' => $ip,
            'user_agent' => $user_agent,
        ], 60);
        
        self::log_info("SSO token generated for user {$user_id} from IP {$ip}");
        
        return rest_ensure_response([
            'success' => true,
            'token' => $token,
            'expires_in' => 60,
        ]);
    }
    
    /**
     * Exchange one-time SSO token for JWT
     */
    public static function exchange_token($request) {
        $token = $request->get_param('token');
        
        if (!$token) {
            self::log_error('Token exchange failed: Missing token');
            return new WP_Error('missing_token', 'Token is required', ['status' => 400]);
        }
        
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        // Rate limiting by IP
        $rate_check = Rate_Limiter::check($ip, 'sso_exchange', 5, 300);
        if (!$rate_check['allowed']) {
            self::log_error("Token exchange rate limited from IP {$ip}");
            return new WP_Error('rate_limit_exceeded', 'Too many requests. Please try again later.', [
                'status' => 429,
                'reset_at' => $rate_check['reset_at'],
            ]);
        }
        
        $transient_key = 'sso_token_' . $token;
        $token_data = get_transient($transient_key);
        
        if (!$token_data) {
            self::log_error("Token exchange failed: Invalid or expired token from IP {$ip}");
            return new WP_Error('invalid_token', 'Token is invalid or expired', ['status' => 401]);
        }
        
        delete_transient($transient_key);
        
        // Security validation (relaxed for cross-origin SSO)
        // Note: IP and User-Agent validation are disabled because:
        // 1. Token is generated on WordPress server but exchanged from Next.js app (different IPs)
        // 2. User-Agent may differ between WordPress page and API call context
        // Security is maintained through:
        // - One-time token (deleted after use)
        // - Short expiration (60 seconds)
        // - Rate limiting
        // - Token validation
        
        // Log for debugging (but don't block)
        $current_ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $current_ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        
        if (defined('WP_DEBUG') && WP_DEBUG) {
            if ($token_data['ip'] !== $current_ip) {
                error_log("[SSO] IP changed during token exchange. Original: {$token_data['ip']}, Current: {$current_ip}");
            }
            if ($token_data['user_agent'] !== $current_ua) {
                error_log("[SSO] User-Agent changed during token exchange. Original: {$token_data['user_agent']}, Current: {$current_ua}");
            }
        }
        
        $user = get_user_by('ID', $token_data['user_id']);
        
        if (!$user) {
            self::log_error("Token exchange failed: User {$token_data['user_id']} not found");
            return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
        }
        
        $jwt_token = JWT_Manager::generate_token($user, time() + (HOUR_IN_SECONDS * 2));
        
        if (!$jwt_token) {
            self::log_error("Token exchange failed: JWT generation failed for user {$user->ID}");
            return new WP_Error('token_generation_failed', 'Failed to generate JWT', ['status' => 500]);
        }
        
        self::log_info("JWT issued to user {$user->ID} from IP {$ip}");
        
        // Get custom profile picture if available, otherwise use default avatar
        $custom_profile_picture = get_user_meta($user->ID, 'akf_profile_picture', true);
        $avatar_url = !empty($custom_profile_picture) ? $custom_profile_picture : get_avatar_url($user->ID, ['size' => 96]);
        
        return rest_ensure_response([
            'success' => true,
            'token' => $jwt_token,
            'expires_in' => HOUR_IN_SECONDS * 2,
            'user' => [
                'id' => $user->ID,
                'email' => $user->user_email,
                'display_name' => $user->display_name,
                'roles' => $user->roles,
                'avatar_url' => $avatar_url,
            ],
        ]);
    }
    
    /**
     * Validate JWT token
     */
    public static function validate_token($request) {
        $token = $request->get_param('token');
        
        if (!$token) {
            $token = JWT_Manager::get_token_from_header();
        }
        
        if (!$token) {
            self::log_error('Token validation failed: Missing token');
            return new WP_Error('missing_token', 'Token is required', ['status' => 400]);
        }
        
        $payload = JWT_Manager::verify_token($token);
        
        if (!$payload) {
            self::log_error('Token validation failed: Invalid token');
            return new WP_Error('invalid_token', 'Invalid or expired token', ['status' => 401]);
        }
        
        $user_id = $payload['data']['user']['id'];
        $user = get_user_by('ID', $user_id);
        
        if (!$user) {
            self::log_error("Token validation failed: User {$user_id} not found");
            return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
        }
        
        // Get custom profile picture if available, otherwise use default avatar
        $custom_profile_picture = get_user_meta($user->ID, 'akf_profile_picture', true);
        $avatar_url = !empty($custom_profile_picture) ? $custom_profile_picture : get_avatar_url($user->ID, ['size' => 96]);
        
        return rest_ensure_response([
            'success' => true,
            'valid' => true,
            'user' => [
                'id' => $user->ID,
                'email' => $user->user_email,
                'display_name' => $user->display_name,
                'roles' => $user->roles,
                'avatar_url' => $avatar_url,
            ],
        ]);
    }
    
    /**
     * Refresh JWT token
     */
    public static function refresh_token($request) {
        $token = $request->get_param('token');
        
        if (!$token) {
            $token = JWT_Manager::get_token_from_header();
        }
        
        if (!$token) {
            self::log_error('Token refresh failed: Missing token');
            return new WP_Error('missing_token', 'Token is required', ['status' => 400]);
        }
        
        $payload = JWT_Manager::verify_token($token);
        
        if (!$payload) {
            self::log_error('Token refresh failed: Invalid token');
            return new WP_Error('invalid_token', 'Invalid or expired token', ['status' => 401]);
        }
        
        $user_id = $payload['data']['user']['id'];
        $user = get_user_by('ID', $user_id);
        
        if (!$user) {
            self::log_error("Token refresh failed: User {$user_id} not found");
            return new WP_Error('user_not_found', 'User not found', ['status' => 404]);
        }
        
        $new_token = JWT_Manager::generate_token($user, HOUR_IN_SECONDS * 2);
        
        if (!$new_token) {
            self::log_error("Token refresh failed: JWT generation failed for user {$user->ID}");
            return new WP_Error('token_generation_failed', 'Failed to generate new token', ['status' => 500]);
        }
        
        if (isset($payload['jti'])) {
            JWT_Manager::revoke_token($user_id, $payload['jti']);
        }
        
        self::log_info("Token refreshed for user {$user->ID}");
        
        return rest_ensure_response([
            'success' => true,
            'token' => $new_token,
            'expires_in' => HOUR_IN_SECONDS * 2,
        ]);
    }
    
    /**
     * Revoke JWT token
     */
    public static function revoke_token($request) {
        $token = $request->get_param('token');
        
        if (!$token) {
            $token = JWT_Manager::get_token_from_header();
        }
        
        if (!$token) {
            return new WP_Error('missing_token', 'Token is required', ['status' => 400]);
        }
        
        $payload = JWT_Manager::verify_token($token);
        
        if (!$payload) {
            return new WP_Error('invalid_token', 'Invalid token', ['status' => 401]);
        }
        
        $user_id = $payload['data']['user']['id'];
        $token_id = $payload['jti'] ?? null;
        
        if ($token_id) {
            JWT_Manager::revoke_token($user_id, $token_id);
        }
        
        self::log_info("Token revoked for user {$user_id}");
        
        return rest_ensure_response([
            'success' => true,
            'message' => 'Token revoked successfully',
        ]);
    }
    
    /**
     * Log error message
     */
    private static function log_error($message) {
        error_log('[SSO_Endpoint ERROR] ' . $message);
    }
    
    /**
     * Log info message
     */
    private static function log_info($message) {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('[SSO_Endpoint INFO] ' . $message);
        }
    }
}

/**
 * Register SSO endpoints
 */
add_action('rest_api_init', ['SSO_Endpoint', 'register']);

/**
 * WordPress Dashboard Redirect Function
 * Call this function from a link/button in WordPress to redirect users to dashboard
 * 
 * Usage in WordPress:
 * <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=redirect_to_dashboard'), 'redirect_dashboard')); ?>">Go to Dashboard</a>
 * 
 * Or create a shortcode:
 * [dashboard_link] or [dashboard_link text="Go to Dashboard"]
 */
/**
 * WordPress Dashboard Redirect Function
 * Call this function from a link/button in WordPress to redirect users to dashboard
 */
/**
 * WordPress Dashboard Redirect Function
 * Call this function from a link/button in WordPress to redirect users to dashboard
 * 
 * Usage in WordPress:
 * <a href="<?php echo esc_url(wp_nonce_url(admin_url('admin-post.php?action=redirect_to_dashboard'), 'redirect_dashboard')); ?>">Go to Dashboard</a>
 * 
 * Or create a shortcode:
 * [dashboard_link] or [dashboard_link text="Go to Dashboard"]
 */
function akf_redirect_to_dashboard() {
    try {
        // Verify nonce for security
        if (!isset($_GET['_wpnonce']) || !wp_verify_nonce($_GET['_wpnonce'], 'redirect_dashboard')) {
            error_log('[Dashboard Redirect ERROR] Security check failed');
            wp_die('Security check failed', 'Error', ['response' => 403]);
        }
        
        // Check if user is logged in
        if (!is_user_logged_in()) {
            error_log('[Dashboard Redirect] User not logged in, redirecting to login');
            wp_redirect(wp_login_url());
            exit;
        }
        
        $user_id = get_current_user_id();
        
        // Rate limiting
        $rate_check = Rate_Limiter::check($user_id, 'dashboard_redirect', 10, 300);
        if (!$rate_check['allowed']) {
            error_log("[Dashboard Redirect ERROR] Rate limit exceeded for user {$user_id}");
            wp_die('Too many redirect attempts. Please try again later.', 'Rate Limit Exceeded', ['response' => 429]);
        }
        
        // Generate SSO token
        $token = bin2hex(random_bytes(32));
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        set_transient('sso_token_' . $token, [
            'user_id' => $user_id,
            'created_at' => time(),
            'ip' => $ip,
            'user_agent' => $user_agent,
        ], 60);
        
        // Get dashboard URL from options or use default
        $dashboard_url = get_option('akf_dashboard_url', 'http://localhost:3000');
//         $dashboard_url = get_option('akf_dashboard_url', 'https://akf-learning-dash-git-feat-auth-adeel-akhtars-projects.vercel.app');

        
        // Redirect to dashboard with SSO token
        $redirect_url = add_query_arg('sso_token', $token, $dashboard_url . '/auth/callback');
        
        // Log success
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("[Dashboard Redirect SUCCESS] User {$user_id} redirected from IP {$ip} to {$redirect_url}");
        }
        
        wp_redirect($redirect_url);
        exit;
        
    } catch (Exception $e) {
        error_log('[Dashboard Redirect ERROR] Exception: ' . $e->getMessage());
        wp_die('An error occurred while redirecting to dashboard. Please try again.', 'Error', ['response' => 500]);
    }
}
add_action('admin_post_redirect_to_dashboard', 'akf_redirect_to_dashboard');
add_action('admin_post_nopriv_redirect_to_dashboard', 'akf_redirect_to_dashboard');

/**
 * Shortcode for Dashboard Link
 * Usage: [dashboard_link] or [dashboard_link text="Go to Dashboard"]
 * Works with Bricks Builder and standard WordPress editor
 */
/**
 * Shortcode for Dashboard Link with Dynamic Token Generation
 * Generates fresh token on each click, solving both back button and expiry issues
 * Usage: [dashboard_link] or [dashboard_link text="Go to Dashboard"]
 */
function akf_dashboard_link_shortcode($atts) {
    // Parse attributes
    $atts = shortcode_atts([
        'text' => 'Go to Dashboard',
        'class' => 'button button-primary',
    ], $atts);
    
    // Check if user is logged in
    if (!is_user_logged_in()) {
        return '<a href="' . esc_url(wp_login_url()) . '" class="' . esc_attr($atts['class']) . '">' . esc_html($atts['text']) . '</a>';
    }
    
    // Get dashboard URL from options or use default
    $dashboard_url = get_option('akf_dashboard_url', 'http://localhost:3000');
    
    // Generate unique ID for this button instance
    $button_id = 'dashboard-link-' . uniqid();
    
    // Output button with JavaScript that generates token on click
    ob_start();
    ?>
    <button 
        id="<?php echo esc_attr($button_id); ?>" 
        class="<?php echo esc_attr($atts['class']); ?> dashboard-sso-button"
        data-dashboard-url="<?php echo esc_attr($dashboard_url); ?>"
        data-nonce="<?php echo wp_create_nonce('wp_rest'); ?>"
    >
        <span class="button-text"><?php echo esc_html($atts['text']); ?></span>
        <span class="button-spinner" style="display:none;">⏳</span>
    </button>
    
    <script>
    (function() {
        const button = document.getElementById('<?php echo esc_js($button_id); ?>');
        if (!button) return;
        
        const buttonText = button.querySelector('.button-text');
        const buttonSpinner = button.querySelector('.button-spinner');
        const dashboardUrl = button.getAttribute('data-dashboard-url');
        const nonce = button.getAttribute('data-nonce');
        
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Prevent double clicks
//             if (button.disabled) return;
//             button.disabled = true;
            
            // Show loading state
//             if (buttonText) buttonText.style.display = 'none';
//             if (buttonSpinner) buttonSpinner.style.display = 'inline';
            
            try {
                // Generate fresh SSO token via REST API
                const response = await fetch('<?php echo rest_url('custom-api/v1/auth/generate-sso-token'); ?>', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': nonce
                    },
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to generate token');
                }
                
                const data = await response.json();
                
                if (data.success && data.token) {
                    // Redirect to dashboard with fresh token
                    const redirectUrl = dashboardUrl + '/auth/callback?sso_token=' + data.token;
                    window.location.href = redirectUrl;
                } else {
                    throw new Error('Invalid response from server');
                }
                
            } catch (error) {
                console.error('Dashboard redirect error:', error);
                alert('Failed to redirect to dashboard. Please try again.');
                
                // Reset button state
                button.disabled = false;
                if (buttonText) buttonText.style.display = 'inline';
                if (buttonSpinner) buttonSpinner.style.display = 'none';
            }
        });
    })();
    </script>
    
    <style>
    .dashboard-sso-button {
        cursor: pointer;
        position: relative;
    }
    .dashboard-sso-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    .dashboard-sso-button .button-spinner {
        font-size: 1em;
    }
    </style>
    <?php
    return ob_get_clean();
}
add_shortcode('dashboard_link', 'akf_dashboard_link_shortcode');

/**
 * Ensure shortcodes work in Bricks Builder
 * Bricks Builder sometimes needs explicit shortcode processing
 */
add_filter('bricks/builder/shortcode_output', function($content) {
    if (has_shortcode($content, 'dashboard_link')) {
        $content = do_shortcode($content);
    }
    return $content;
}, 10, 1);

/**
 * Alternative: Add shortcode support for Bricks frontend
 */
add_action('wp', function() {
    if (function_exists('bricks_is_builder') && !bricks_is_builder()) {
        // Ensure shortcodes are processed on frontend
        add_filter('the_content', 'do_shortcode', 11);
    }
});

/**
 * Add CORS headers for dashboard access
 * Update the allowed origins with your actual Vercel URL
 */
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        $origin = get_http_origin();
        $allowed_origins = [
            'https://akf-learning-dash-git-feat-auth-adeel-akhtars-projects.vercel.app', // Update with your actual Vercel URL
            'http://localhost:3000',
            'http://localhost:3001',
        ];
        
        if ($origin && in_array($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
        }
        
        return $value;
    });
}, 15);
