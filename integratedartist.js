document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const artistName = params.get('artist');
    const artistId = params.get('id');
    
    if (artistName && artistId) {
        (async function() {
            try {
                const token = await getToken();
                await displayArtistInfo(artistId, token.access_token);
                await displayTopTracks(artistId, token.access_token);
            } catch (error) {
                console.error("Error: ", error);
            }
        })();
    }

    async function getToken() {
        try {
            const client_id = //erased
            const client_secret = //erased
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

    async function displayArtistInfo(artistId, access_token) {
        const endpoint = `https://api.spotify.com/v1/artists/${artistId}`;
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            if (!response.ok) {
                throw new Error('Could not fetch artist info');
            }
            const data = await response.json();
            
            const artistNameDiv = document.getElementById('artist-name');
            artistNameDiv.innerHTML = `<h2>${data.name}</h2>`;
            
            const artistGenresDiv = document.getElementById('artist-genres');
            artistGenresDiv.innerHTML = `<p>Genres: ${data.genres.join(', ')}</p>`;
            
            const artistFollowersDiv = document.getElementById('artist-followers');
            artistFollowersDiv.innerHTML = `<p>Followers: ${data.followers.total}</p>`;
            
            const artistImage = document.getElementById('artist-image');
            artistImage.src = data.images[0].url;
        } catch (error) {
            console.error('Error fetching artist info:', error.message);
        }
    }

    async function displayTopTracks(artistId, access_token) {
        const endpoint = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`;
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            });
            if (!response.ok) {
                throw new Error('Could not fetch top tracks');
            }
            const data = await response.json();
            
            const topTracksDiv = document.getElementById('top-tracks');
            topTracksDiv.innerHTML = '<h2>Top Tracks</h2>';
            data.tracks.forEach(track => {
                topTracksDiv.innerHTML += `
                    <div class="track-item">
                        <img class="track-album-cover" src="${track.album.images[0].url}" alt="${track.name}">
                        <div class="track-info">
                            <p>${track.name}</p>
                            <p>Album: ${track.album.name}</p>
                        </div>
                    </div>
                `;
            });
        } catch (error) {
            console.error('Error fetching top tracks:', error.message);
        }
    }
});
