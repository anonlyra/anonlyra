
document.addEventListener("DOMContentLoaded", function () {
    const menus = document.querySelectorAll('.slide-menu');
    menus.forEach((menu) => {
        const dots = menu.querySelectorAll('.dot');
        const container = menu.parentElement;
        const slides = container.querySelectorAll('.slide-content');

        dots.forEach((dot) => {
            dot.setAttribute('tabindex', '0');

            dot.addEventListener('click', () => {
                const slideIndex = dot.getAttribute('data-slide');

                // Remove 'active' class from all dots and add it to the clicked dot
                dots.forEach((d) => d.classList.remove('active'));
                dot.classList.add('active');

                // Hide all slides and display the selected one
                slides.forEach((slide) => {
                    const video = slide.querySelector('video');
                    if (slide.getAttribute('data-slide') === slideIndex) {
                        slide.style.display = 'block';
                        if (video) {
                            // Lazy load video if not already loaded
                            if (video.dataset.src && !video.src) {
                                video.src = video.dataset.src;
                                video.load();
                                
                                // Show loading indicator
                                const loadingDiv = video.querySelector('.video-loading');
                                if (loadingDiv) {
                                    loadingDiv.style.display = 'block';
                                }
                                
                                // Hide loading indicator when video is ready
                                video.addEventListener('loadeddata', () => {
                                    if (loadingDiv) {
                                        loadingDiv.style.display = 'none';
                                    }
                                });
                            }
                            video.currentTime = 0;
                            video.play();
                        }
                    } else {
                        slide.style.display = 'none';
                        if (video) {
                            video.pause();
                        }
                    }
                });
            });

            // Enable keyboard navigation
            dot.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    dot.click();
                }
            });
        });
    });

    // Ensure initially visible slides load their videos (but do not preload hidden ones)
    const visibleSlides = document.querySelectorAll('.slide-content');
    visibleSlides.forEach((slide) => {
        const styleAttr = slide.getAttribute('style') || '';
        const isVisible = /display\s*:\s*block/i.test(styleAttr);
        if (isVisible) {
            const video = slide.querySelector('video');
            if (video && video.dataset && video.dataset.src && !video.src) {
                video.src = video.dataset.src;
                video.load();
                // Autoplay muted is generally allowed by browsers
                video.play().catch(() => {});
            }
        }
    });

    // Generic click-to-load handler for any video with data-src (e.g., teaser)
    const lazyVideos = document.querySelectorAll('video[data-src]');
    lazyVideos.forEach((video) => {
        video.addEventListener('click', () => {
            if (video.dataset.src && !video.src) {
                video.src = video.dataset.src;
                video.load();
                video.play().catch(() => {});
            }
        }, { once: false });
    });

    const comparisonContainers = document.querySelectorAll('.comparison-container');

    comparisonContainers.forEach((container) => {
        const wrapper = container.querySelector('.comparison-wrapper');
        const video1 = container.querySelector('.video1');
        const video2 = container.querySelector('.video2');
        
        video1.addEventListener('loadedmetadata', function () {
            const videoHeight = video1.videoHeight;
            const videoWidth = video1.videoWidth;

            // Adjust the wrapper height based on the video's aspect ratio
            const aspectRatio = videoHeight / videoWidth  * 100;;
            wrapper.style.paddingBottom = `${aspectRatio}%`;

            // Ensure all comparison videos align with the wrapper's height
            wrapper.querySelectorAll('.comparison-video').forEach(video => {
                video.style.height = '100%';
            });
        });
        video1.addEventListener('timeupdate', () => {
            const progress = video1.currentTime / video1.duration;
            video2.currentTime = progress * video2.duration;
        });
        // Synchronize the playback of both videos
        video1.addEventListener('play', () => {
            video2.currentTime = video1.currentTime;
            video2.play();
        });

        video1.addEventListener('pause', () => {
            video2.pause();
        });

        video1.addEventListener('seeked', () => {
            video2.currentTime = video1.currentTime;
        });


        const slide = (xPosition) => {
            const rect = wrapper.getBoundingClientRect();
            let position = ((xPosition - rect.left) / rect.width);
            position = Math.max(0, Math.min(1, position));

            // Update the clip path of the second video
            video2.style.clipPath = `inset(0px ${100 - position * 100}% 0px 0px)`;

            // Redraw the slider on the canvas
            drawSlider(position);
        };
        // document.addEventListener('mousemove', (e) => {
        //     if (!isDown) return;
        //     slide(e.pageX);
        // });

        // Attach mousemove event listener to the container
        container.addEventListener('mousemove', (e) => {
            slide(e.pageX);
        });
        // Attach touchmove event listener to the container
        container.addEventListener('touchmove', (e) => {
            slide(e.touches[0].pageX);
        });
        // document.addEventListener('touchmove', (e) => {
        //     if (!isDown) return;
        //     slide(e.touches[0].pageX);
        // });

        // Initialize the clip of video2
        video2.style.clipPath = `inset(0px 50% 0px 0px)`;

        const canvas = container.querySelector('.slider-canvas');
        const context = canvas.getContext('2d');

        // Resize the canvas to match the video dimensions
        const resizeCanvas = () => {
            const rect = wrapper.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            // drawSlider(currentPosition); // 重新绘制滑动条
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const drawSlider = (position) => {
            context.clearRect(0, 0, canvas.width, canvas.height);

            const currX = position * canvas.width;
            const vidWidth = canvas.width;
            const vidHeight = canvas.height;
            const arrowPosY = vidHeight / 10;

            const arrowLength = 0.09 * vidHeight;
            const arrowHeadWidth = 0.025 * vidHeight;
            const arrowHeadLength = 0.04 * vidHeight;
            const arrowWidth = 0.007 * vidHeight;

            // Draw circle
            context.beginPath();
            context.arc(currX, arrowPosY, arrowLength * 0.7, 0, Math.PI * 2, false);
            context.fillStyle = "#FFD79340"; // Adjust color and transparency
            context.fill();
            // Optionally remove the stroke to eliminate the boundary
            // context.strokeStyle = "#444444";
            // context.stroke();

            // Draw border line
            context.beginPath();
            context.moveTo(currX, 0);
            context.lineTo(currX, vidHeight);
            context.closePath();
            context.strokeStyle = "#444444";
            context.lineWidth = 0.3;
            context.stroke();

            // Draw arrow
            context.beginPath();
            context.moveTo(currX, arrowPosY - arrowWidth / 2);

            // Move right until meeting arrow head
            context.lineTo(currX + arrowLength / 2 - arrowHeadLength / 2, arrowPosY - arrowWidth / 2);

            // Draw right arrow head
            context.lineTo(currX + arrowLength / 2 - arrowHeadLength / 2, arrowPosY - arrowHeadWidth / 2);
            context.lineTo(currX + arrowLength / 2, arrowPosY);
            context.lineTo(currX + arrowLength / 2 - arrowHeadLength / 2, arrowPosY + arrowHeadWidth / 2);
            context.lineTo(currX + arrowLength / 2 - arrowHeadLength / 2, arrowPosY + arrowWidth / 2);

            // Go back to the left until meeting left arrow head
            context.lineTo(currX - arrowLength / 2 + arrowHeadLength / 2, arrowPosY + arrowWidth / 2);

            // Draw left arrow head
            context.lineTo(currX - arrowLength / 2 + arrowHeadLength / 2, arrowPosY + arrowHeadWidth / 2);
            context.lineTo(currX - arrowLength / 2, arrowPosY);
            context.lineTo(currX - arrowLength / 2 + arrowHeadLength / 2, arrowPosY - arrowHeadWidth / 2);
            context.lineTo(currX - arrowLength / 2 + arrowHeadLength / 2, arrowPosY);

            // Continue back to starting point
            context.lineTo(currX - arrowLength / 2 + arrowHeadLength / 2, arrowPosY - arrowWidth / 2);
            context.lineTo(currX, arrowPosY - arrowWidth / 2);

            context.closePath();

            context.fillStyle = "#444444";
            context.fill();
        };


        // Initial draw
        drawSlider(0.5);

    });
});





// JavaScript to handle scene and method selection
var activeMethodPill = null;
var activeScenePill = null;
var select = false;

document.addEventListener('DOMContentLoaded', function () {
    activeMethodPill = document.querySelector('.method-pill.active');
    activeScenePill = document.querySelector('.scene-pill.active');

    // Initialize the video with the default active scene and method
    if (activeMethodPill && activeScenePill) {
        selectCompVideo(activeMethodPill, activeScenePill);
    }
});

function selectCompVideo(methodPill, scenePill, n_views) {
    methodPill = methodPill || activeMethodPill;
    scenePill = scenePill || activeScenePill;

    select = true;

    if (activeMethodPill && methodPill !== activeMethodPill) {
        activeMethodPill.classList.remove("active");
    }
    if (activeScenePill && scenePill !== activeScenePill) {
        activeScenePill.classList.remove("active");
    }

    activeMethodPill = methodPill;
    activeScenePill = scenePill;
    methodPill.classList.add("active");
    scenePill.classList.add("active");

    var method = methodPill.getAttribute("data-value");
    var scene = scenePill.getAttribute("data-value") || scenePill.getAttribute("data-slide");

    // Construct the video URL without 'mode'
    var video = document.getElementById("compVideo0");
    video.src = "assets/single_view/" + scene + "_" + method + "_vs_ours.mp4";
    video.load();

    // Remove or comment out these lines if not needed
    // var viewNum = document.getElementById("compVideoValue");
    // if (n_views) {
    //     viewNum.innerHTML = n_views;
    // }
}


// JavaScript to handle scene and method selection
// var activeDrivingMethodPill = null;
// var activeDrivingScenePill = null;
var driving_select = false;

document.addEventListener('DOMContentLoaded', function () {
    activeDrivingMethodPill = document.querySelector('.driving-method-pill.active');
    activeDrivingScenePill = document.querySelector('.driving-scene-pill.active');

    // Initialize the video with the default active scene and method
    if (activeDrivingMethodPill && activeDrivingScenePill) {
        selectDrivingCompVideo(activeDrivingMethodPill, activeDrivingScenePill);
    }
});

function selectDrivingCompVideo(DrivingmethodPill, DrivingscenePill, n_views) {
    DrivingmethodPill = DrivingmethodPill || activeDrivingMethodPill;
    DrivingscenePill = DrivingscenePill || activeDrivingScenePill;

    driving_select = true;

    if (activeDrivingMethodPill && DrivingmethodPill !== activeDrivingMethodPill) {
        activeDrivingMethodPill.classList.remove("active");
    }
    if (activeDrivingScenePill && DrivingscenePill !== activeDrivingScenePill) {
        activeDrivingScenePill.classList.remove("active");
    }

    activeDrivingMethodPill = DrivingmethodPill;
    activeDrivingScenePill = DrivingscenePill;
    DrivingmethodPill.classList.add("active");
    DrivingscenePill.classList.add("active");

    var method = DrivingmethodPill.getAttribute("data-value");
    var scene = DrivingscenePill.getAttribute("data-value") || DrivingscenePill.getAttribute("data-slide");

    // Construct the video URL without 'mode'
    var video = document.getElementById("compVideo1");
    video.src = "assets/driving_waymo/" + method + "_" + scene + ".mp4";
    video.load();

    // Remove or comment out these lines if not needed
    // var viewNum = document.getElementById("compVideoValue");
    // if (n_views) {
    //     viewNum.innerHTML = n_views;
    // }
}

var newDrivingSelect = false;
var activeNewMethodPill, activeNewScenePill;

document.addEventListener('DOMContentLoaded', function () {
  // Select the initially active pills for the new video player
  activeNewMethodPill = document.querySelector('.new-method-pill.active');
  activeNewScenePill = document.querySelector('.new-scene-pill.active');

  // Initialize the video with the default active scene and method
  if (activeNewMethodPill && activeNewScenePill) {
    updateNewVideoPlayer(activeNewMethodPill, activeNewScenePill);
  }
});

function updateNewVideoPlayer(newMethodPill, newScenePill, n_views) {
  // Fallback to active pills if not provided
  newMethodPill = newMethodPill || activeNewMethodPill;
  newScenePill = newScenePill || activeNewScenePill;

  newDrivingSelect = true;

  // Update active states
  if (activeNewMethodPill && newMethodPill !== activeNewMethodPill) {
    activeNewMethodPill.classList.remove("active");
  }
  if (activeNewScenePill && newScenePill !== activeNewScenePill) {
    activeNewScenePill.classList.remove("active");
  }
  activeNewMethodPill = newMethodPill;
  activeNewScenePill = newScenePill;
  newMethodPill.classList.add("active");
  newScenePill.classList.add("active");

  // Get the method and scene values from data attributes
  var method = newMethodPill.getAttribute("data-method");
  var scene = newScenePill.getAttribute("data-scene") || newScenePill.getAttribute("data-slide");

  // Construct the new video URL based on the new file structure
  var video = document.getElementById("newCompVideo1");
  video.src = "assets/cosmos/driving/output/" + scene + "_" + method + ".mp4";
  video.load();

  // (Optional) You can update any view counts or additional info here using n_views if needed.
}

// (Optional) Add a listener to auto-play video when metadata is loaded
var newVideo = document.getElementById("newCompVideo1");
newVideo.addEventListener('loadedmetadata', function() {
  newVideo.play();
  console.log(`New Video Size: ${newVideo.videoWidth}x${newVideo.videoHeight}`);
  newVideo.hidden = false;
});