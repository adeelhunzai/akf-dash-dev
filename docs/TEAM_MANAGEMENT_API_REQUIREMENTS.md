# Team Management API Requirements

This document outlines the API endpoints required for the Team Management feature (Create Team modal).

## Overview

The Create Team modal allows administrators to create LearnDash groups (teams) by:
1. Selecting a course
2. Adding a team name and description
3. Selecting learners to add to the team

## Required API Endpoints

### 1. Get Courses List

**Endpoint:** `GET /wp-json/custom-api/v1/courses`

**Purpose:** Fetch all available LearnDash courses for the course dropdown

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `per_page` (number, default: 100) - Number of courses per page
- `search` (string, optional) - Search term to filter courses by title

**Response Format:**
```json
{
  "courses": [
    {
      "id": 123,
      "title": "Introduction to Programming",
      "slug": "intro-programming",
      "status": "publish",
      "enrolled_count": 45,
      "completion_rate": 78.5
    }
  ],
  "total": 50,
  "total_pages": 1,
  "current_page": 1
}
```

**LearnDash Integration:**
- Use `learndash_get_posts_by_type()` or `get_posts()` with `post_type` = `'sfwd-courses'`
- Get course ID and title
- Optionally include enrollment statistics

**Example Implementation:**
```php
function get_courses_list($request) {
    $page = $request->get_param('page') ?: 1;
    $per_page = $request->get_param('per_page') ?: 100;
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
        $args['s'] = $search;
    }

    $query = new WP_Query($args);
    $courses = array();

    foreach ($query->posts as $post) {
        $courses[] = array(
            'id' => $post->ID,
            'title' => $post->post_title,
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'enrolled_count' => learndash_get_course_users_count($post->ID),
            'completion_rate' => 0 // Calculate if needed
        );
    }

    return array(
        'courses' => $courses,
        'total' => $query->found_posts,
        'total_pages' => $query->max_num_pages,
        'current_page' => $page
    );
}
```

---

### 2. Create Team (LearnDash Group)

**Endpoint:** `POST /wp-json/custom-api/v1/teams`

**Purpose:** Create a new LearnDash group with selected learners and associate it with a course

**Request Body:**
```json
{
  "name": "2021_EST_CircleK_1",
  "course_id": 123,
  "description": "Team description here",
  "learner_ids": [45, 67, 89, 102]
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Team created successfully",
  "team_id": 456,
  "team": {
    "id": 456,
    "name": "2021_EST_CircleK_1",
    "avatar": "20",
    "facilitators": 0,
    "members": 4,
    "progress": 0,
    "status": "Active",
    "created": "2024-12-04"
  }
}
```

**LearnDash Integration:**

The function should:
1. Create a new LearnDash group (custom post type: `groups`)
2. Associate the course with the group
3. Add learners as group members
4. Set group metadata

**Example Implementation:**
```php
function create_team($request) {
    $name = $request->get_param('name');
    $course_id = $request->get_param('course_id');
    $description = $request->get_param('description');
    $learner_ids = $request->get_param('learner_ids');

    // Validate required fields
    if (empty($name) || empty($course_id) || empty($learner_ids)) {
        return new WP_Error(
            'missing_fields',
            'Name, course, and learners are required',
            array('status' => 400)
        );
    }

    // Create LearnDash group
    $group_id = wp_insert_post(array(
        'post_type' => 'groups',
        'post_title' => $name,
        'post_content' => $description,
        'post_status' => 'publish'
    ));

    if (is_wp_error($group_id)) {
        return new WP_Error(
            'creation_failed',
            'Failed to create team',
            array('status' => 500)
        );
    }

    // Associate course with group
    // LearnDash stores group courses in post meta
    $group_courses = array($course_id);
    update_post_meta($group_id, 'learndash_group_enrolled_' . $course_id, time());
    learndash_set_group_enrolled_courses($group_id, $group_courses);

    // Add learners to group
    foreach ($learner_ids as $user_id) {
        ld_update_group_access($user_id, $group_id, false);
    }

    // Get team data for response
    $team = array(
        'id' => $group_id,
        'name' => $name,
        'avatar' => count($learner_ids),
        'facilitators' => 0,
        'members' => count($learner_ids),
        'progress' => 0,
        'status' => 'Active',
        'created' => current_time('Y-m-d')
    );

    return array(
        'success' => true,
        'message' => 'Team created successfully',
        'team_id' => $group_id,
        'team' => $team
    );
}
```

---

## Existing Endpoints Being Used

### Get Users List (Already Implemented)
**Endpoint:** `GET /wp-json/custom-api/v1/users/list`

This endpoint is already being used to fetch learners. The Create Team modal filters users by role `learner` to populate the learners list.

**Query Parameters:**
- `page` - Page number
- `per_page` - Results per page
- `search` - Search by name or email
- `role` - Filter by role (using `learner` for this feature)

---

## Frontend Implementation

### Files Modified/Created:
1. **lib/store/api/coursesApi.ts** - New API slice for courses
2. **lib/types/courses.types.ts** - TypeScript types for courses
3. **lib/store/api/teamApi.ts** - Added `createTeam` mutation
4. **lib/types/team.types.ts** - Added `CreateTeamRequest` and `CreateTeamResponse` types
5. **components/team-management/create-team-dialog.tsx** - Updated to use real API data

### Features Implemented:
- ✅ Fetch learners dynamically from WordPress API (filtered by role)
- ✅ Fetch courses dynamically from WordPress API
- ✅ Search learners by name or email with debouncing
- ✅ Select/deselect learners with checkboxes
- ✅ Form validation (team name, course, at least one learner)
- ✅ Create team API call with loading states
- ✅ Success/error toast notifications
- ✅ Auto-refresh teams list after creation

---

## Testing the Integration

### 1. Test Courses Endpoint
```bash
curl -X GET "https://akfhub-dev.inspirartweb.com/wp-json/custom-api/v1/courses?per_page=10" \
  -u "username:password"
```

### 2. Test Create Team Endpoint
```bash
curl -X POST "https://akfhub-dev.inspirartweb.com/wp-json/custom-api/v1/teams" \
  -H "Content-Type: application/json" \
  -u "username:password" \
  -d '{
    "name": "Test Team",
    "course_id": 123,
    "description": "Test description",
    "learner_ids": [45, 67]
  }'
```

---

## Notes for Backend Developer

1. **LearnDash Functions:**
   - `learndash_set_group_enrolled_courses()` - Associate courses with group
   - `ld_update_group_access()` - Add users to group
   - `learndash_get_course_users_count()` - Get enrollment count
   - `learndash_get_group_courses()` - Get group courses

2. **WordPress Functions:**
   - `wp_insert_post()` - Create group post
   - `update_post_meta()` - Store group metadata
   - `get_posts()` - Query courses

3. **Authentication:**
   - Use WordPress REST API authentication (Basic Auth or Application Passwords)
   - Verify user has capability to create groups: `current_user_can('group_leader')` or `manage_options`

4. **Error Handling:**
   - Return proper HTTP status codes (400 for validation, 500 for server errors)
   - Include descriptive error messages in response

5. **Validation:**
   - Verify course exists before creating team
   - Verify all learner IDs are valid WordPress users
   - Sanitize and validate all input data

---

## Questions?

If you need clarification on any endpoint or have questions about the LearnDash integration, please reach out!
