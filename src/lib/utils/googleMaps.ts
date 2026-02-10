let isLoading = false;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
    // If already loaded, resolve immediately
    if (isLoaded && isGoogleMapsLoaded()) {
        return Promise.resolve();
    }

    // If currently loading, return the existing promise
    if (isLoading && loadPromise) {
        return loadPromise;
    }

    isLoading = true;

    loadPromise = new Promise((resolve, reject) => {
        // Create a unique callback name
        const callbackName = `initGoogleMaps_${Date.now()}`;

        // Define the callback function
        window[callbackName] = () => {
            // Wait for Places library to be available
            const checkPlaces = setInterval(() => {
                if (
                    typeof window !== "undefined" &&
                    window.google &&
                    window.google.maps &&
                    window.google.maps.places &&
                    window.google.maps.places.Autocomplete
                ) {
                    clearInterval(checkPlaces);
                    isLoaded = true;
                    isLoading = false;
                    delete window[callbackName];
                    resolve();
                }
            }, 50);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkPlaces);
                if (!isLoaded) {
                    isLoading = false;
                    delete window[callbackName];
                    reject(new Error("Google Maps Places API failed to load"));
                }
            }, 10000);
        };

        // Create and append script
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=${callbackName}`;
        script.async = true;
        script.defer = true;

        script.onerror = () => {
            isLoading = false;
            loadPromise = null;
            delete window[callbackName];
            reject(new Error("Failed to load Google Maps script"));
        };

        document.head.appendChild(script);
    });

    return loadPromise;
}

export function isGoogleMapsLoaded(): boolean {
    return (
        isLoaded &&
        typeof window !== "undefined" &&
        !!window.google &&
        !!window.google.maps &&
        !!window.google.maps.places &&
        !!window.google.maps.places.Autocomplete
    );
}
