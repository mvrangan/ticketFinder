document.addEventListener('DOMContentLoaded', () => {
    const searchBar = document.getElementById('search-bar');
    const addArtistButton = document.getElementById('add-artist-button');
    const generatePlaylistButton = document.getElementById('generate-playlist-button');
    const artistList = document.getElementById('artist-list');
    const MAX_ARTISTS = 5; // Maximum number of artists allowed
    let currentIndex = -1; // Keeps track of the current suggestion index
    let artistCount = 0; // Counter for the number of added artists
    let artistIds = []; // Store artist IDs for playlist generation

    searchBar.addEventListener('input', (event) => {
        showSuggestions(event.target.value);
        currentIndex = -1; // Reset index on new input
    });

    searchBar.addEventListener('keydown', (event) => {
        const suggestions = document.querySelectorAll('.suggestion-item');

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (currentIndex < suggestions.length - 1) {
                currentIndex++;
                highlightSuggestion(suggestions, currentIndex);
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (currentIndex > 0) {
                currentIndex--;
                highlightSuggestion(suggestions, currentIndex);
            }
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (currentIndex >= 0 && currentIndex < suggestions.length) {
                searchBar.value = suggestions[currentIndex].textContent;
                document.getElementById('suggestions').innerHTML = '';
                addArtist();
            }
        }
    });

    addArtistButton.addEventListener('click', () => {
        addArtist();
    });

    generatePlaylistButton.addEventListener('click', async () => {
        if (artistIds.length === 0) {
            alert("Please add at least one artist before generating a playlist.");
            return;
        }

        try {
            const token = await getToken();
            const relatedArtists = await getRelatedArtists(artistIds, token.access_token);
            console.log("related Artists func called. artist IDs: " + relatedArtists.length);
            
            const songs = await getRelatedSongs(relatedArtists, token.access_token);
            console.error("gotrelatedSongs function done");
            
            const songsQuery = songs.map(track => `${encodeURIComponent(track.name)}:${encodeURIComponent(track.album.name)}:${encodeURIComponent(track.album.images[0].url)}`).join('|');
            window.location.href = `playlist.html?songs=${encodeURIComponent(songsQuery)}`;
            // displayRelatedSongs(songs);
            // console.error("displayrelatedSongs function done");
            // window.location.href = 'playlist.html'; // Redirect to the playlist page
        } catch (error) {
            console.error("Error generating playlist: ", error);
        }
    });

    async function getRelatedArtists(artistIds, access_token) {
        const relatedArtists = new Set();
        const maxArtistsPerArtist = 10; // Number of related artists per artist
        const maxUniqueArtists = maxArtistsPerArtist * artistIds.length; // Total number of unique related artists needed
    
        for (const artistId of artistIds) {
            try {
                const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    }
                });
    
                if (!response.ok) {
                    throw new Error(`Failed to fetch related artists for ${artistId}`);
                }
    
                const data = await response.json();
                
                data.artists.slice(0, maxArtistsPerArtist).forEach(artist => relatedArtists.add(artist.id));
                
                if (relatedArtists.size >= maxUniqueArtists) break;
                
            } catch (error) {
                console.error('Error fetching related artists:', error);
            }
        }
    
        // console.log("length: " + relatedArtists.size);
        console.log("related artists: " + Array.from(relatedArtists).join(", "));
        console.log("related Artists func called. artist IDs: " + relatedArtists.size);
        return Array.from(relatedArtists).slice(0, maxUniqueArtists);
    //    return relatedArtists;

    }   

    async function getRelatedSongs(relatedArtists, access_token) {
        const allSongs = [];
        
        for (const artistId of relatedArtists) {
            const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            const data = await response.json();
            console.log(data);
            
            // Merge the current artist's top tracks with the allSongs array
            allSongs.push(...data.tracks.slice(0, 2));
        }
        
        console.log("allSongs: ", allSongs);
        return allSongs;
    }

    function highlightSuggestion(suggestions, index) {
        suggestions.forEach((item, i) => {
            if (i === index) {
                item.classList.add('highlight');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('highlight');
            }
        });
    }

    async function addArtist() {
        if (artistCount >= MAX_ARTISTS) {
            alert(`You can only add up to ${MAX_ARTISTS} artists.`);
            return;
        }

        const artistName = searchBar.value;
        if (artistName.length === 0) {
            return;
        }

        try {
            const token = await getToken();
            const artistId = await getArtistId(artistName, token.access_token);
            const artistData = await getArtistData(artistId, token.access_token);

            const artistCard = document.createElement('div');
            artistCard.classList.add('artist-card');
            artistCard.innerHTML = `
                <img src="${artistData.images[0].url}" alt="${artistData.name}">
                <p>${artistData.name}</p>
                <button class="trash-button">&times;</button>
            `;
            artistCard.addEventListener('click', () => {
                window.location.href = `integratedartist.html?artist=${encodeURIComponent(artistData.name)}&id=${artistData.id}`;
            });

            // Add event listener for the trash can button
            artistCard.querySelector('.trash-button').addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent the click event from triggering the artist card click
                artistList.removeChild(artistCard);
                artistIds = artistIds.filter(id => id !== artistId); // Remove artist ID
                artistCount--; // Decrement artist count
            });

            artistList.appendChild(artistCard);
            searchBar.value = '';

            artistCount++; // Increment artist count
            artistIds.push(artistId); // Add artist ID for playlist generation
        } catch (error) {
            console.error("Error: ", error);
        }
    }

    async function getToken() {
        try {
            const client_id = 'd58a56f6d4194ddaac431cc035ef19bf'; 
            const client_secret = 'ad2c8a90376542d4a15e1f84b50471d4';
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                body: new URLSearchParams({
                    'grant_type': 'client_credentials',
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret),
                },
            });
            return await response.json();
        } catch(error) {
            console.error(error);
            throw error;
        }
    }

    async function getArtistId(artistName, access_token) {
        const endpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`;
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            if (!response.ok) {
                throw new Error('Could not find artist');
            }
            const data = await response.json();
            return data.artists.items[0].id;
        } catch (error) {
            console.error('Error searching for artist', error);
            throw error;
        }
    }

    async function getArtistData(artistId, access_token) {
        const endpoint = `https://api.spotify.com/v1/artists/${artistId}`;
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            if (!response.ok) {
                throw new Error('Could not fetch artist data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching artist data', error);
            throw error;
        }
    }

//     function showSuggestions(artistName) {
//         if (artistName.length === 0) {
//             document.getElementById('suggestions').innerHTML = '';
//             return;
//         }

//         const apiFetchLink = `https://app.ticketmaster.com/discovery/v2/suggest?apikey=NRNGP7p9IHnBQvw0ip9rH6d5W7gxbimk&keyword=${artistName}`;
//         fetch(apiFetchLink, { method: 'GET' })
//             .then(response => response.json())
//             .then(data => {
//                 if (data && data._embedded && data._embedded.attractions) {
//                     const suggestions = data._embedded.attractions.map(attraction => attraction.name);
//                     document.getElementById('suggestions').innerHTML = suggestions.map(item => `<div class="suggestion-item">${item}</div>`).join('');
//                     document.querySelectorAll('.suggestion-item').forEach((item, index) => {
//                         item.addEventListener('click', () => {
//                             searchBar.value = item.textContent;
//                             document.getElementById('suggestions').innerHTML = '';
//                             currentIndex = index;
//                         });
//                     });
//                 }
//             })
//             .catch(error => console.error('Error fetching suggestions:', error));
//     }
// 


    function showSuggestions(artistName) {
        if (artistName.length === 0) {
            document.getElementById('suggestions').innerHTML = '';
            return;
        }

        // Update the URL to point to PHP script
        const apiFetchLink = //erased
        
        fetch(apiFetchLink, { method: 'GET' })
            .then(response => response.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const suggestions = data;
                    document.getElementById('suggestions').innerHTML = suggestions.map(item => `<div class="suggestion-item">${item}</div>`).join('');
                    document.querySelectorAll('.suggestion-item').forEach((item, index) => {
                        item.addEventListener('click', () => {
                            searchBar.value = item.textContent;
                            document.getElementById('suggestions').innerHTML = '';
                            currentIndex = index;
                        });
                    });
                } else {
                    console.error('Error: ', data.error || 'Unknown error');
                }
            })
            .catch(error => console.error('Error fetching suggestions:', error));
    }
});
