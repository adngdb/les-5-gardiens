require.config({
    baseUrl: "js"
});

require(['lib/three', 'lib/FirstPersonControls'], function (three) {
    "use strict";

    var camera, scene, renderer,
    geometry, material, controls;
    var taille = 5;

    var matlabyrinth = [
        [1, 0, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 0, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 1, 1, 1],
    ];

    function init() {
        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = 200;


        controls = new THREE.FirstPersonControls( camera );

        controls.movementSpeed = 200;
        controls.lookSpeed = 0.05;
        controls.noFly = true;
        controls.lookVertical = true;
        controls.activeLook = false;

        for (var i = 0; i < 5; ++i) {
            for (var j = 0; j < 5; ++j) {
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
                    material = new THREE.MeshBasicMaterial( { color: 0xff0000+i*50+j*50*256, wireframe: false } );
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

    function animate() {
            // note: three.js includes requestAnimationFrame shim
            requestAnimationFrame( animate );
            render();
            console.log("ma position: "+ camera.position.x +" y:"+ camera.position.y +" z:" + camera.position.z);
        }

    function render() {

        var SavePosX = camera.position.x;
        var SavePosZ = camera.position.z;
        controls.update(1.0);
        var NewIndI = Math.floor((camera.position.x+1)/200.0);
        var NewIndJ = Math.floor((camera.position.z+1)/200.0);
        console.log("indice : " + NewIndI + " , " + NewIndJ);
        if ((NewIndI<0) || (NewIndI>=taille) || (NewIndJ<0) || (NewIndJ>=taille)|| (matlabyrinth[NewIndI][NewIndJ])) {// invalide movement : restore previous position
            camera.position.x = SavePosX;
            camera.position.z = SavePosZ;
            console.log("reset position");
            
        }
        renderer.render( scene, camera );
        // console.log("camera.position.x : "+camera.position.x);
        // console.log("camera.position.y : "+camera.position.y);  
        // console.log("camera.position.z : "+camera.position.z);  
    }

    init();

});