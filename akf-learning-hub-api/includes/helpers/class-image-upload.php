<?php
/**
 * Image Upload Helper
 * Handles base64 image uploads
 *
 * @package AKF_Learning_Dashboard
 */

// Exit if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Image Upload Helper class
 */
class AKF_Image_Upload {
	
	/**
	 * Handle base64 image upload
	 *
	 * @param string $base64_image Base64 encoded image data
	 * @param int $user_id User ID
	 * @return array Result array with success status and url or message
	 */
	public static function handle_base64_image_upload( $base64_image, $user_id ) {
		try {
			// Validate input
			if ( empty( $base64_image ) ) {
				return array( 'success' => false, 'message' => 'No image data provided.' );
			}
			
			if ( ! is_numeric( $user_id ) || $user_id <= 0 ) {
				return array( 'success' => false, 'message' => 'Invalid user ID.' );
			}
			
			// Extract image data
			if ( ! preg_match( '/data:image\/(\w+);base64,(.+)/', $base64_image, $matches ) ) {
				return array( 'success' => false, 'message' => 'Invalid image data format. Expected base64 encoded image.' );
			}
			
			$image_type = $matches[1];
			$base64_data = $matches[2];
			
			// Decode base64 data
			$image_data = base64_decode( $base64_data, true );
			if ( $image_data === false ) {
				return array( 'success' => false, 'message' => 'Failed to decode base64 image data.' );
			}
			
			// Validate image type
			$allowed_types = array( 'jpeg', 'jpg', 'png', 'gif' );
			if ( ! in_array( strtolower( $image_type ), $allowed_types ) ) {
				return array( 'success' => false, 'message' => 'Invalid image type. Only JPEG, PNG, and GIF are allowed.' );
			}
			
			// Validate file size (max 5MB)
			if ( strlen( $image_data ) > 5 * 1024 * 1024 ) {
				return array( 'success' => false, 'message' => 'Image size exceeds 5MB limit.' );
			}
			
			// Get upload directory
			$upload_dir = wp_upload_dir();
			if ( $upload_dir['error'] ) {
				return array( 'success' => false, 'message' => 'Failed to get upload directory: ' . $upload_dir['error'] );
			}
			
			// Create profile pictures directory if it doesn't exist
			$profile_dir = $upload_dir['basedir'] . '/profile-pictures';
			if ( ! file_exists( $profile_dir ) ) {
				$mkdir_result = wp_mkdir_p( $profile_dir );
				if ( ! $mkdir_result ) {
					return array( 'success' => false, 'message' => 'Failed to create profile pictures directory. Please check directory permissions.' );
				}
			}
			
			// Check if directory is writable
			if ( ! is_writable( $profile_dir ) ) {
				return array( 'success' => false, 'message' => 'Profile pictures directory is not writable. Please check directory permissions.' );
			}
			
			// Generate unique filename
			$filename = 'profile-' . $user_id . '-' . time() . '.' . $image_type;
			$file_path = $profile_dir . '/' . $filename;
			
			// Save file
			$write_result = @file_put_contents( $file_path, $image_data );
			if ( $write_result === false ) {
				$error = error_get_last();
				$error_message = 'Failed to save image file.';
				if ( $error && isset( $error['message'] ) ) {
					$error_message .= ' Error: ' . $error['message'];
				}
				return array( 'success' => false, 'message' => $error_message );
			}
			
			// Verify file was created
			if ( ! file_exists( $file_path ) ) {
				return array( 'success' => false, 'message' => 'File was not created successfully.' );
			}
			
			// Return success with file URL
			$file_url = $upload_dir['baseurl'] . '/profile-pictures/' . $filename;
			return array( 'success' => true, 'url' => $file_url );
			
		} catch ( Exception $e ) {
			return array( 'success' => false, 'message' => 'An error occurred while uploading the image: ' . $e->getMessage() );
		}
	}
}

// Create global helper function for backward compatibility
if ( ! function_exists( 'handle_base64_image_upload' ) ) {
	/**
	 * Handle base64 image upload
	 *
	 * @param string $base64_image Base64 encoded image data
	 * @param int $user_id User ID
	 * @return array Result array
	 */
	function handle_base64_image_upload( $base64_image, $user_id ) {
		return AKF_Image_Upload::handle_base64_image_upload( $base64_image, $user_id );
	}
}

