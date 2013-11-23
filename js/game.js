require.config({
    baseUrl: "js"
});

require(['lib/three', 'lib/FirstPersonControls'], function (three, first_person_controls) {
    "use strict";

    var camera, scene, renderer,
    geometry, material, controls;
    var size = 10;

    var matlabyrinth = [
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    function init() {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = 200;


        controls = new THREE.FirstPersonControls( camera );

        controls.movementSpeed = 200;
        controls.lookSpeed = 1;
        controls.noFly = true;
        controls.lookVertical = true;
        controls.activeLook = true;
        controls.mouseDragOn = true;

        for (var i = 0; i < size; ++i) {
            for (var j = 0; j < size; ++j) {
                // floor
                geometry = new THREE.CubeGeometry( 200, 200, 200 );
                material = new THREE.MeshBasicMaterial( { color: 0x555555, wireframe: false } );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.position.x = i*200;
                mesh.position.z = j*200;
                mesh.position.y = -200;
                scene.add( mesh );

                if(matlabyrinth[i][j]) {
                    geometry = new THREE.CubeGeometry( 200, 200, 200 );
                    material = new THREE.MeshBasicMaterial( { color: 0xff0000+i*(255/size)+j*(255/size)*256, wireframe: false } );
                    var mesh = new THREE.Mesh( geometry, material );
                    mesh.position.x = i*200;
                    mesh.position.z = j*200;
                    scene.add( mesh );
                }

                // roof
                geometry = new THREE.CubeGeometry( 200, 200, 200 );
                material = new THREE.MeshBasicMaterial( { color: 0x999999, wireframe: false } );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.position.x = i*200;
                mesh.position.z = j*200;
                mesh.position.y = 200;
                scene.add( mesh );
            };
        };

        renderer = new THREE.CanvasRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );

        document.body.appendChild( renderer.domElement );

        animate();
    }

    var fps = 30;
    var now;
    var then = Date.now();
    var interval = 1000/fps;
    var delta;
    function animate() {
            // note: three.js includes requestAnimationFrame shim
            requestAnimationFrame( animate );

            now = Date.now();
            delta = now - then;

            if (delta > interval) {
                // update time stuffs

                // Just `then = now` is not enough.
                // Lets say we set fps at 10 which means
                // each frame must take 100ms
                // Now frame executes in 16ms (60fps) so
                // the loop iterates 7 times (16*7 = 112ms) until
                // delta > interval === true
                // Eventually this lowers down the FPS as
                // 112*10 = 1120ms (NOT 1000ms).
                // So we have to get rid of that extra 12ms
                // by subtracting delta (112) % interval (100).
                // Hope that makes sense.

                then = now - (delta % interval);

                // ... Code for Drawing the Frame ...
                render();

                // console.log("ma position: "+ camera.position.x +" y:"+ camera.position.y +" z:" + camera.position.z);
            }
        }

    function render() {

        var SavePosX = camera.position.x;
        var SavePosZ = camera.position.z;
        controls.update(1.0);
        var NewIndI = Math.round((camera.position.x)/200.0);
        var NewIndJ = Math.round((camera.position.z)/200.0);
        // console.log("indice : " + NewIndI + " , " + NewIndJ);
        if ((NewIndI<0) || (NewIndI>=size) || (NewIndJ<0) || (NewIndJ>=size)|| (matlabyrinth[NewIndI][NewIndJ])) {// invalide movement : restore previous position
            camera.position.x = SavePosX;
            camera.position.z = SavePosZ;
            // console.log("reset position");

        }
        camera.position.y = 0;
        renderer.render( scene, camera );
        // console.log("camera.position.x : "+camera.position.x);
        // console.log("camera.position.y : "+camera.position.y);
        // console.log("camera.position.z : "+camera.position.z);
    }

    init();

});
