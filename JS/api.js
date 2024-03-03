(function () {
  document.addEventListener('DOMContentLoaded', function () {
    fetchRoverInformation();// Upon loading the page, trigger the fetchRoverInformation function to populate the rover dropdown.
    // Ensure the rover dropdown triggers changes by adding a change event listener.
    document.querySelector("#roverNameInput").addEventListener("change", function () {
      fetchCamerasForRover(); // When selecting rover.
    });

    document.querySelector("#search").addEventListener("click", function () {
      document.getElementById("spinner").style.display = "inline-block"; // loading spinner

      // Check if empty.
      const roverName = document.getElementById("roverNameInput").value;
      const dateTimeInput = document.getElementById("dateTimeInput").value;
      const cameraInput = document.getElementById("cameraInput").value;

      const roverNameInputError = document.getElementById("roverNameInputError");
      const dateTimeInputError = document.getElementById("dateTimeInputError");
      const cameraInputError = document.getElementById("cameraInputError");

      // Reset error messages.
      roverNameInputError.innerHTML = "";
      dateTimeInputError.innerHTML = "";
      cameraInputError.innerHTML = "";

      let errors = [];

      if (!roverName) {
        errors.push("Error: Rover name required.");
        roverNameInputError.innerHTML = "Error: Rover name required.";
      }

      if (!dateTimeInput) {
        errors.push("Error: Date required.");
        dateTimeInputError.innerHTML = "Error: Date required.";
      }

      if (!cameraInput) {
        errors.push("Error: Camera is required.");
        cameraInputError.innerHTML = "Error: Camera required.";
      }

      if (errors.length > 0) {
        // there is errors.
        return;
      }

      fetchRoverInformation(); // no errors.

      fetchAndDisplaySearchResults(roverName, dateTimeInput, cameraInput);

    });

    document.querySelector("#reset").addEventListener("click", function () {
      document.getElementById("roverNameInput").value = "";
      document.getElementById("dateTimeInput").value = "";
      document.getElementById("cameraInput").value = "";

      fetchRoverInformation();

      clearSearchResults();
      document.getElementById("header").style.display = "none";

      const roverNameInputError = document.getElementById("roverNameInputError");
      const dateTimeInputError = document.getElementById("dateTimeInputError");
      const cameraInputError = document.getElementById("cameraInputError");

      roverNameInputError.innerHTML = "";
      dateTimeInputError.innerHTML = "";
      cameraInputError.innerHTML = "";
    });

    document.getElementById("savedImagesButton").addEventListener("click", function () {
      // Toggle the visibility of the form and the saved images container
      const formContainer = document.querySelector(".container.mt-5");
      const images = document.getElementById("images");
      if (formContainer.style.display !== "none") {
        formContainer.style.display = "none";
        images.style.display = "block";
      } else {
        formContainer.style.display = "block";
        images.style.display = "none";
      }
    });

    populateFavoritesTable();

  });

  /**
   * Get the information about a Mars rover
   */
  function fetchRoverInformation() {
    // API key for NASA Mars Photos API
    const API_KEY = "kM58bo1N2OBzT6WpvcXOb5gAGwtNJ625OTeCmZMs";

    // user input
    const roverName = document.getElementById("roverNameInput").value;
    const dateTimeInput = document.getElementById("dateTimeInput");
    const cameraInput = document.getElementById("cameraInput");

    // Fetch data
    fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers?api_key=${API_KEY}`)
        .then(check_status)
        .then(response => response.json())
        .then(data => {
          const roverDropdown = document.getElementById("roverNameInput");

          // Check response.
          if (data.rovers && data.rovers.length > 0) {
            roverDropdown.innerHTML = "";

            // Rover names
            data.rovers.forEach(rover => {
              const option = document.createElement("option");
              option.value = rover.name;
              option.textContent = rover.name;
              roverDropdown.appendChild(option);
            });

            roverDropdown.value = roverName; // User input

            const targetRover = data.rovers.find(rover => rover.name === roverName);


            if (targetRover) { // validate date
              const landingDate = new Date(targetRover.landing_date);
              const maxDate = new Date(targetRover.max_date);
              const maxSol = targetRover.max_sol;

              const cameras = targetRover.cameras;

              let errors = [];

              if (!cameras.map(camera => camera.name).includes(cameraInput.value)) { // Valid camera.
                errors.push("Selected camera is not available for the chosen rover.");
              }

              if (!isNaN(dateTimeInput.value)) { // Valid date.
                const enteredSol = parseInt(dateTimeInput.value);

                if (enteredSol < 0 || enteredSol > maxSol) {
                  errors.push("Entered Sol is not within the valid range for the chosen rover.");
                }
              } else {
                // Date is entered, validate it
                const enteredDateTime = new Date(dateTimeInput.value);

                if (isNaN(enteredDateTime.getTime()) || (enteredDateTime.getTime() < landingDate.getTime() || enteredDateTime.getTime() > maxDate.getTime())) {
                  errors.push("Entered date is not within the valid range for the chosen rover.");
                }
              }

              if (errors.length > 0) {
                throw new Error(errors.join("\n"));  // Join errors with newline for better readability
              }
            }
          }
        })
        .catch(error => { // Handle errors
          const roverNameInputError = document.getElementById("roverNameInputError");
          const dateTimeInputError = document.getElementById("dateTimeInputError");
          const cameraInputError = document.getElementById("cameraInputError");

          roverNameInputError.innerHTML = "";
          dateTimeInputError.innerHTML = "";
          cameraInputError.innerHTML = "";

          if (!roverName) { // Inputs are missing.
            roverNameInputError.innerHTML = "Error: Rover name required.";
          }

          if (!dateTimeInput.value) {
            dateTimeInputError.innerHTML = "Error: Date required.";
          }

          if (!cameraInput.value) {
            cameraInputError.innerHTML = "Error: Camera required.";
          }

          // Additional specific error conditions
          if (!document.getElementById("roverNameInput")) {
            roverNameInputError.innerHTML = "Error: roverNameInput is null or undefined.";
          }

          if (!document.getElementById("dateTimeInput")) {
            dateTimeInputError.innerHTML = "Error: dateTimeInput is null or undefined.";
          }

          if (!document.getElementById("cameraInput")) {
            cameraInputError.innerHTML = "Error: cameraInput is null or undefined.";
          }

          const errorMessages = error.message.split("\n");

          for (const errorMessage of errorMessages) {
            if (errorMessage.includes("date")) {
              dateTimeInputError.innerHTML = errorMessage;
            } else if (errorMessage.includes("camera")) {
              cameraInputError.innerHTML = errorMessage;
            } else if (errorMessage.includes("Sol")) {
              dateTimeInputError.innerHTML = errorMessage;
            }
          }
        });
  }

  /**
   * search results
   * @param roverName
   * @param dateTimeInput
   * @param cameraInput
   */
  function fetchAndDisplaySearchResults(roverName, dateTimeInput, cameraInput) {
    const API_KEY = "kM58bo1N2OBzT6WpvcXOb5gAGwtNJ625OTeCmZMs";
    const selectedRover = roverName;
    const selectedDate = (isNaN(dateTimeInput) ? `earth_date=${dateTimeInput}` : `sol=${dateTimeInput}`);
    const selectedCamera = `camera=${cameraInput}`;
    const searchResCtr = document.getElementById("searchResCtr");

    fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${selectedRover}/photos?${selectedDate}&${selectedCamera}&api_key=${API_KEY}`)
        .then(check_status)
        .then(response => response.json())
        .then(data => {
          if (data.photos && data.photos.length > 0) {
            clearSearchResults();
            data.photos.forEach(photo => {
              displayImage(photo);
            });
          } else {
            searchResCtr.innerHTML = '<div class="p-3 mb-2 text-dark text-center d-inline-block"><h3>No images found</h3></div>';
          }
        })
        .catch(error => {
          searchResCtr.innerHTML = `<div class="p-3 mb-2 text-dark text-center d-inline-block"><h3>Error: ${error.message}</h3></div>`;
        })
        .finally(() => {
          // Hide the loading spinner after the response is received
          document.getElementById("spinner").style.display = "none";
        });

  }

  function check_status(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response)
    } else {
      return Promise.reject(new Error("Search did not return a valid response, try again later"))
    }
  }

  function fetchCamerasForRover() {
    const selectedRover = document.getElementById("roverNameInput").value;
    const camerasDropdown = document.getElementById("cameraInput");
    const camerasError = document.getElementById("cameraInputError"); // Assuming you have an error element for the camera input

    // API key.
    const API_KEY = "kM58bo1N2OBzT6WpvcXOb5gAGwtNJ625OTeCmZMs";

    // Fetch data from NASA Mars Photos API for the selected rover
    fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/${selectedRover}?api_key=${API_KEY}`)
        .then(check_status)
        .then(response => response.json())
        .then(data => {
          // Check response.
          if (data.rover && data.rover.cameras && data.rover.cameras.length > 0) {
            camerasDropdown.innerHTML = "";

            data.rover.cameras.forEach(camera => {
              const option = document.createElement("option");
              option.value = camera.name;
              option.textContent = camera.name;
              camerasDropdown.appendChild(option);
            });

            camerasError.innerHTML = ""; // Clear previous.
            camerasDropdown.selectedIndex = -1;
          }
        })
        .catch(()=> {
          camerasError.innerHTML = "Error fetching cameras for the selected rover. Please try again later.";
        });
  }

  /**
   * Clear existing search results
   */
  function clearSearchResults() {
    const searchResCtr = document.getElementById("searchResCtr");
    searchResCtr.innerHTML = "";
  }

  /**
   * Function to display each image with information, save button, and view button
   * @param photo
   */
  function displayImage(photo) {
    document.getElementById('header').style.display = 'inline-block';
    const searchResCtr = document.getElementById("searchResCtr");

    // Create containers
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("col-md-4", "mb-4");

    // Display the image
    const imageElement = document.createElement("img");
    imageElement.src = photo.img_src;
    imageElement.alt = `Mars Rover Image - Sol: ${photo.sol}, Camera: ${photo.camera.name}`;
    imageElement.classList.add("img-fluid");
    imageContainer.appendChild(imageElement);

    // Display information (earth date, camera, rover)
    const informationDiv = document.createElement("div");
    informationDiv.innerHTML = `<p>Earth Date: ${photo.earth_date}</p> <p>Sol: ${photo.sol} </p>
 <p>Camera: ${photo.camera.name} </p> <p>Rover: ${photo.rover.name}</p> `;
    imageContainer.appendChild(informationDiv);

    // Create Save button
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.classList.add("btn", "btn-outline-success", "mb-2");
    saveButton.addEventListener("click", function () {
      saveImageToFavorites(photo);
    });
    imageContainer.appendChild(saveButton);

    const viewButton = document.createElement("button");
    viewButton.textContent = "Full size";
    viewButton.classList.add("btn", "btn-outline-primary", "mb-2");
    viewButton.addEventListener("click", function () {
      // Call a function to open the image in a separate window at full resolution
      openImageInSeparateWindow(photo.img_src);
    });
    imageContainer.appendChild(viewButton);

    // Append the image container to the search results container
    searchResCtr.appendChild(imageContainer);
  }

  /**
   * Function to open the image in a separate window at full resolution
   * @param imageSrc
   */
  function openImageInSeparateWindow(imageSrc) {
    // Open a new window or tab with the image
    const fullResolutionWindow = window.open(imageSrc, '_blank');
    if (fullResolutionWindow) {
      fullResolutionWindow.focus();
    } else {
      alert("Please allow pop-ups to view the image in full resolution.");
    }
  }


  /**
   * Save to favorite
   * @param photo The photo object to be saved
   */
  function saveImageToFavorites(photo) {
    if (isPhotoInFavorites(photo)) { // if already saved
      displayToast("This image is already saved in your favorites.");
      return; // if saved
    }

    let favorites = JSON.parse(localStorage.getItem("favorites")) || []; // initialize array
    favorites.push(photo); // adding photo
    localStorage.setItem("favorites", JSON.stringify(favorites));
    displayToast("Image saved to favorites successfully!");
  }

  /**
   * Function to display a Bootstrap toast
   * @param message The message to be displayed in the toast
   */
  function displayToast(message) {
    const toast = document.createElement("div"); // new toast element
    toast.classList.add("toast");
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");

    // toast header
    const header = document.createElement("div");
    header.classList.add("toast-header");

    const strong = document.createElement("strong");
    strong.classList.add("me-auto");
    strong.textContent = "Notification";

    const button = document.createElement("button");
    button.classList.add("btn-close");
    button.setAttribute("type", "button");
    button.setAttribute("data-bs-dismiss", "toast");
    button.setAttribute("aria-label", "Close");

    header.appendChild(strong);
    header.appendChild(button);

    // toast body
    const body = document.createElement("div");
    body.classList.add("toast-body");
    body.textContent = message;

    // Append header and body
    toast.appendChild(header);
    toast.appendChild(body);

    const toastContainer = document.getElementById("toastContainer");
    toastContainer.appendChild(toast);
    const bootstrapToast = new bootstrap.Toast(toast); // new bootstrap toast

    bootstrapToast.show(); // present toast
  }


  /**
   * Function to check if a photo is already saved in favorites
   * @param photo The photo object to be checked
   * @returns {boolean} True if the photo is already saved, false otherwise
   */
  function isPhotoInFavorites(photo) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    return favorites.some(favorite => favorite.img_src === photo.img_src);
  }

  /**
   *  Populate and display saved images
   */
  function populateFavoritesTable() {
    const favoritesTable = document.getElementById("favoritesTable");
    favoritesTable.innerHTML = ""; // reset content
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    favorites.forEach(photo => {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td><p><span style="color: blue; text-decoration: underline;">Image id: ${photo.id}</span></p>Earth date: ${photo.earth_date}, Sol: ${photo.sol}, Camera: ${photo.camera.name}, <button class="btn btn-danger delete-btn">Delete</button></td>
        `;
      favoritesTable.appendChild(row);
    });
  }
  // back button
  document.getElementById("backToSearchForm").addEventListener("click", function () {
    document.querySelector(".container.mt-5").style.display = "block";
    document.getElementById("images").style.display = "none";
  });

  // delete buttons
  document.getElementById("favoritesTable").addEventListener("click", function (event) {
    if (event.target.classList.contains("delete-btn")) {
      // Delete the corresponding image from favorites
      let row = event.target.closest("tr");
      let dataCell = row.querySelector("td"); // Select the first td element in the row
      let cellContent = dataCell.textContent.trim(); // Get the text content and remove leading/trailing whitespace

      // Assuming the content is in the format: "Earth date: XXX, Sol: XXX, Camera: XXX"
      let earthDate = cellContent.split(",")[0].split(":")[1].trim(); // Extract Earth date
      let sol = cellContent.split(",")[1].split(":")[1].trim(); // Extract Sol
      let camera = cellContent.split(",")[2].split(":")[1].trim(); // Extract Camera

      let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
      favorites = favorites.filter(photo => !(photo.earth_date === earthDate && photo.sol === sol && photo.camera.name === camera));
      localStorage.setItem("favorites", JSON.stringify(favorites));

      row.remove();

      localStorage.removeItem("favorites");
    }
  });

  /**
   * carousel function
   */
  function startCarousel() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const carouselInner = document.querySelector(".carousel-inner"); // Clear exist
    carouselInner.innerHTML = "";

    favorites.forEach((photo, index) => {
      const carouselItem = document.createElement("div");
      carouselItem.classList.add("carousel-item");

      // Set the first image as active
      if (index === 0) {
        carouselItem.classList.add("active");
      }

      // Image
      const imageContainer = document.createElement("div");
      imageContainer.classList.add("position-relative"); // Add position-relative class for positioning child elements
      carouselItem.appendChild(imageContainer);

      const image = document.createElement("img");
      image.src = photo.img_src;
      image.alt = `Mars Rover Image - Sol: ${photo.sol}, Camera: ${photo.camera.name}`;
      image.classList.add("d-block", "w-100", "img-fluid");
      imageContainer.appendChild(image);

      // Image caption
      const caption = document.createElement("div");
      caption.classList.add("carousel-caption", "text-center"); // Center align text within the caption
      imageContainer.appendChild(caption);

      const cameraName = document.createElement("h5");
      cameraName.textContent = `${photo.camera.name}`;
      caption.appendChild(cameraName);

      const earthDate = document.createElement("p");
      earthDate.textContent = `${photo.earth_date}`;
      caption.appendChild(earthDate);

      const viewButton = document.createElement("button");
      viewButton.textContent = "Full size";
      viewButton.classList.add("btn", "btn-primary", "btn-sm", "mt-2");
      viewButton.addEventListener("click", function () {
        openImageInSeparateWindow(photo.img_src);
      });
      caption.appendChild(viewButton);

      carouselInner.appendChild(carouselItem);
    });

    const carousel = document.getElementById("carousel"); // present carousel
    carousel.style.display = "block";
  }

  // start button
  document.getElementById("carouselStart").addEventListener("click", startCarousel);

  /**
   * Stop carousel
   */
  function stopCarousel() {

    // Get the carousel element
    const carousel = document.getElementById("carousel");

    // Hide the carousel
    carousel.style.display = "none";
  }

  // stop button
  document.getElementById("carouselStop").addEventListener("click", stopCarousel);

})();