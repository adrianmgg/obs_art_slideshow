function setupEvents(target) {
    target.addEventListener('slideshowphase', function(e) {
        if(e.detail.phase === 'intro') {
            let bounds = e.target.querySelector('.content-inner').getBoundingClientRect();
            e.target.style.setProperty('--negative-width', `${-(bounds.width)}px`);
        }
    });

    target.addEventListener('slideshowmedialoaded', function(e) {
    });
}

document.addEventListener('slideshowinit', function(e) {
    console.log(e);
    setupEvents(e.detail.root);
});

