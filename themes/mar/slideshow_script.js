document.addEventListener('slideshowphase', function(e) {
    if(e.detail.phase === 'intro') {
        let bounds = e.target.querySelector('.content-inner').getBoundingClientRect();
        e.target.style.setProperty('--negative-width', `${-(bounds.width)}px`);
    }
});

document.addEventListener('slideshowmedialoaded', function(e) {
});
