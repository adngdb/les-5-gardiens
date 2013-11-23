require.config({
    baseUrl: "js"
});

require(['lib/three', 'lib/FirstPersonControls'], function (three) {
    "use strict";

    var camera, scene, renderer,
    geometry, material, controls;

    var matlabyrinth = [
        [1, 0, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 0, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 1, 1, 1],
    ];


    //init();
    //animate();

    function init() {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = 1000;


        controls = new THREE.FirstPersonControls( camera );

        controls.movementSpeed = 70;
        controls.lookSpeed = 0.05;
        controls.noFly = true;
        controls.lookVertical = false;

        for (var i = 0; i < 5; ++i) {
            for (var j = 0; j < 5; ++j) {
                geometry = new THREE.CubeGeometry( 200, 200, 200 );
                material = new THREE.MeshBasicMaterial( { color: 0xff0000+i*50+j*50, wireframe: false } );
                var mesh = new THREE.Mesh( geometry, material );
                mesh.position.x = i*200;
                mesh.position.y = j*200;
                //mesh.position.z = i*200 +j*5*200;
                scene.add( mesh );
            };
        };

        //mesh = new THREE.Mesh( geometry, material );
        //scene.add( mesh );

        renderer = new THREE.CanvasRenderer();
        renderer.setSize( window.innerWidth, window.innerHeight );

        document.body.appendChild( renderer.domElement );

        animate();
    }

    function animate() {
            // note: three.js includes requestAnimationFrame shim
            requestAnimationFrame( animate );
            render();
        }

    function render() {

        controls.update(0.5);
        renderer.render( scene, camera );
        console.log("camera.position.x : "+camera.position.x);
        console.log("camera.position.y : "+camera.position.y);  
        console.log("camera.position.z : "+camera.position.z);  
    }

    init();

});