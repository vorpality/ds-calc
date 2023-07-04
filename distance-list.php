<?php
/*
Plugin Name: Store Distance Calculator
Plugin URI: YourPluginURI
Description: Calculates the distance between a user's address and store addresses.
Version: 1.0.0
Author: YourName
Author URI: YourAuthorURI
*/

defined( 'ABSPATH' ) || exit;
/*
// Add a custom field to the REST API response
function add_custom_field_to_rest_api($post, $field_name, $request) {
    return get_field($field_name, $post->ID);
}

// Register the custom field for a specific post type
function register_custom_field_for_rest_api() {
    register_rest_field('store', 'address', array(
        'get_callback' => 'add_custom_field_to_rest_api',
        'schema' => null,
    ));
}
add_action('rest_api_init', 'register_custom_field_for_rest_api');
*/
// Enqueue scripts and styles
function enqueue_list_scripts() {
    // Enqueue the script containing the storeDistanceCalculatorInit function
    $script_version = '1.0.0'; // Update the version number when you make changes to the script
    wp_enqueue_script( 'store-distance-calculator', plugin_dir_url( __FILE__ ) . 'js/store-distance-calculator.js', array( 'jquery' ), $script_version, true );

    // Enqueue the Google Maps API script with a callback function
    $api_key = 'AIzaSyDY56cwNRUcmVLV3LpSUUwjPWx4TQJHr3I'; // Replace with your own Google Maps API key
    $callback_script = "
        function initMap() {
            storeDistanceCalculatorInit();
        }
        jQuery(document).ready(function($) {
            var script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key=" . $api_key . "&libraries=places&callback=initMap';
            document.body.appendChild(script);
        });
    ";
    wp_add_inline_script( 'store-distance-calculator', $callback_script );

    // Enqueue the CSS file
    $css_version = '1.0.0'; // Update the version number when you make changes to the CSS
    wp_enqueue_style( 'store-distance-calculator-style', plugin_dir_url( __FILE__ ) . 'css/store-distance-calculator.css', array(), $css_version );
}
add_action( 'wp_enqueue_scripts', 'enqueue_list_scripts' );

function getStoreAddresses() {
    $args = array(
        'category_name' => 'stores', // Replace 'stores' with the slug of your category
        'posts_per_page' => -1,
        'post_status' => 'publish'
    );

    $query = new WP_Query($args);

    $store_addresses = array();

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();

            $store_address = array(
                'postId' => get_the_ID(),
                'address' => get_field('address', get_the_ID()) // Replace 'address' with the name of your ACF field
            );

            if ($store_address['address']) {
                $store_addresses[] = $store_address;
            }
        }
    }

    wp_reset_postdata();

    return $store_addresses;
}

function store_distance_calculator_shortcode($atts) {
    $atts = shortcode_atts(array(
        'categories' => 'club,bar',
    ), $atts);

    $categories = explode(',', $atts['categories']);

    ob_start(); // Start output buffering
    ?>
    <div id="store-distance-calculator">
        <form id="store-address-form" method="post">
            <label for="user-address">Enter Your Address:</label>
            <input type="text" id="user-address" name="user-address" required>
            <input type="hidden" id="store-categories" name="store-categories" value="<?php echo esc_attr(implode(',', $categories)); ?>">
            <input type="submit" value="Calculate Distance">
        </form>
        <div id="store-distance-result"></div>
    </div>
    <?php
    $content = ob_get_clean(); // Get the buffered output
    return $content;
}
add_shortcode('store_distance', 'store_distance_calculator_shortcode');