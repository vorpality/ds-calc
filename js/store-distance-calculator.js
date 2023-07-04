function storeDistanceCalculatorInit() {
	jQuery(document).ready(function($) {
    	// Create the autocomplete input field
    	var autocomplete = new google.maps.places.Autocomplete(document.getElementById('user-address'));

   		$('#store-address-form').on('submit', function(e) {
      		e.preventDefault();

			var userAddress = $('#user-address').val();
		 	// Fetch store addresses from both "club" and "bar" categories
		  	var categories = ['club', 'bar'];
		  	var promises = categories.map(function(category) {
				return getStoreAddresses(category);
			});

      		Promise.all(promises)
        	.then(function(storeAddressesArray) {
          		var storeAddresses = storeAddressesArray.flat();
          		//console.log('Addresses:', storeAddresses);
          		geocodeAddress(userAddress)
				.then(function(userLatLng) {
              		var distances = [];
              		var count = 0;

              		storeAddresses.forEach(function(storeAddress) {
                		//console.log("User address is " + userAddress + ", store address is " + storeAddress.address);

               		 	geocodeAddress(storeAddress.address)
                  		.then(function(storeLatLng) {
                    		console.log("User lat lng is: " + userLatLng + ", store lat lng is: " + storeLatLng, " store cat is " + 									storeAddress.category);
                    		var distance = calculateDistance(userLatLng, storeLatLng);
                    		distances.push({
							  	postId: storeAddress.postId,
							  	address: storeAddress.address,
							  	distance: distance,
							  	category: storeAddress.category // Include the category information
                    		});
                    		count++;

                    		if (count === storeAddresses.length) {
                      			updateDistanceResults(distances);
                    		}
                  		})
                  		.catch(function(error) {
                    		console.log('Error geocoding store address:', error);
                  		});
              		});
            	})
            	.catch(function(error) {
              		console.log('Error geocoding user address:', error);
            	});
        	})
        	.catch(function(error) {
         	 	console.log('Error fetching store addresses:', error);
        	});
    	});
  	});
}


function getStoreAddresses(category) {
  	return new Promise(function(resolve, reject) {
    	var endpointUrl = '../wp-json/wp/v2/' + category; // Replace with the actual endpoint URL

    	jQuery.ajax({
      		url: endpointUrl,
      		method: 'GET',
      		success: function(response) {
				var results = [];
				response.forEach(function(post) {
				  	var postId = post.id; // Access the post ID as post.id
				  	var address = post.acf.address; // Replace 'address' with the name of your custom field
					//console.log("post id : " + postId + " address = " + address);
				  	if (address) {
            			results.push({
							postId: postId,
							address: address,
							category: category
            			});
          			}
        		});
        		resolve(results); // Resolve the promise with the results
      		},
      		error: function(xhr, status, error) {
        		reject(error); // Reject the promise with the error message
      		}
    	});
  	});
}


function geocodeAddress(address) {
  	return new Promise(function(resolve, reject) {
    	var geocoder = new google.maps.Geocoder();
    	geocoder.geocode({ address: address }, function(results, status) {
      		//console.log('Geocoding address:', address);
      		//console.log('Geocoding status:', status);
      		if (status === 'OK') {
        		if (results[0]) {
          			var location = results[0].geometry.location;
          			//console.log('Geocoded location:', location);
          			resolve(location);
        		} 
				else {
          			reject(new Error('No results found'));
        		}
      		} 
			else {
        		reject(new Error('Geocode failed due to: ' + status));
      		}
    	});
  	});
}

function calculateDistance(startLatLng, endLatLng) {
    // Calculate distance using the Haversine formula
    var earthRadius = 6371; // Earth's radius in kilometers
    var lat1 = degreesToRadians(startLatLng.lat()); // Get latitude from startLatLng
    var lon1 = degreesToRadians(startLatLng.lng()); // Get longitude from startLatLng
    var lat2 = degreesToRadians(endLatLng.lat());
    var lon2 = degreesToRadians(endLatLng.lng());
    
    var latDiff = lat2 - lat1;
    var lonDiff = lon2 - lon1;
    
    var a = Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distance = earthRadius * c; // Calculate distance
    
    return distance.toFixed(1); // Return distance rounded to 1 decimal place
}

function updateDistanceResults(distances) {
  	var resultList = jQuery('#store-distance-result');
  	resultList.empty(); // Clear the previous results

  	// Group distances by category
  	var distancesByCategory = {};
  	distances.forEach(function(result) {
    	var category = result.category || 'Uncategorized'; // Default category if not available
    	if (!distancesByCategory[category]) {
      		distancesByCategory[category] = [];
    	}
    	distancesByCategory[category].push(result);
  	});

	// Generate separate lists for each category
	Object.keys(distancesByCategory).forEach(function(category) {
    	var categoryDistances = distancesByCategory[category];
   	 	var sortedDistances = categoryDistances.sort(function(a, b) {
      		return a.distance - b.distance;
    	});

    	var categoryList = jQuery('<ul>'); // Create an unordered list element
    	console.log("Category: " + category); // Display category for testing
    	sortedDistances.forEach(function(result) {
			var listItem = jQuery('<li>');
			if (result.address) {
				listItem.text('Post ID: ' + result.postId + ', Address: ' + result.address + ', Distance: ' + result.distance + ' km');
			} 
			else {
				listItem.text('Post ID: ' + result.postId + ', Address: Unavailable, Distance: ' + result.distance + ' km');
			}
			categoryList.append(listItem); // Append the list item to the list
		});

    	var categoryHeader = jQuery('<h2>').text(category); // Create a heading element for the category
    	resultList.append(categoryHeader); // Append the category heading
    	resultList.append(categoryList); // Append the list to the result container
  	});
}


function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}
