document.addEventListener('slideshow_phase', function(e) {
    if(e.detail.phase === 'intro') {
        let bounds = e.target.querySelector('.content-inner').getBoundingClientRect();
        e.target.style.setProperty('--negative-width', `${-(bounds.width)}px`);
    }
});

document.addEventListener('slideshow_media_loaded', function(e) {
});
