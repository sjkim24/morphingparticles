var dispersed = false;
var firstDone = false;
var secondDone = false;
var thirdDone = false;
var fRgba = []; // first img rgba data
var sRgba = []; // second img rgba data
var tRgba = []; // third img rgba data

var WIDTH = window.innerWidth,
    HEIGHT = window.innerHeight;

var VIEW_ANGLE = 45,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.01,
    FAR = 10000;

var $container = $("#container");
var renderer = new THREE.WebGLRenderer();
var camera = new THREE.PerspectiveCamera(
  VIEW_ANGLE,
  ASPECT,
  NEAR,
  FAR);

var scene = new THREE.Scene();
scene.add(camera);
camera.position.z = 1000;
renderer.setSize(WIDTH, HEIGHT);
$container.append(renderer.domElement);

var particleCount = 5200,
    particles = new THREE.Geometry();

var pMaterial = new THREE.PointsMaterial({
  size: 15,
  map: new THREE.TextureLoader().load("images/particle.png"),
  blending: THREE.AdditiveBlending,
  transparent: true
});

for (var i = 0; i < particleCount; i++) {
  var x = Math.random() * 1600 - 800;
  var y = getRandomInt(600, 1500)
  var z = Math.random() * 30 - 15;
  var particle = new THREE.Vector3(x, y, z);
  particle.updated = 0;
  particles.vertices.push(particle);
};

var particleSystem = new THREE.Points(particles, pMaterial);
particleSystem.sortParticles = true;
scene.add(particleSystem);

function drawImage(imageObj, array) {
  var canvas = $("#canvas")[0];
  var context = canvas.getContext("2d");
  var imageX = 0;
  var imageY = 0;
  var imageWidth = imageObj.width;
  var imageHeight = imageObj.height;
  context.drawImage(imageObj, imageX, imageY);
  var imageData = context.getImageData(imageX, imageY, imageWidth, imageHeight);
  var data = imageData.data;
  for(var y = 0; y < imageHeight; y+= 4) {
    for(var x = 0; x < imageWidth; x+= 4) {
      var red = data[((imageWidth * y) + x) * 4];
      var green = data[((imageWidth * y) + x) * 4 + 1];
      var blue = data[((imageWidth * y) + x) * 4 + 2];
      var alpha = data[((imageWidth * y) + x) * 4 + 3];
      if (red < 100) {
        var pX = (x % 500) - 249;
        var pY = 249 - y;
        array.push([pX, pY, red, green, blue, alpha]);
      }
    }
  }
};

var addDestination = function(particle, x, y, z) {
  var dest = new THREE.Vector3(x, y, z);
  particle.destination = dest;
};

var addVelocity = function(particle) {
  var xDiff = (particle.destination.x - particle.x) / 180;
  var yDiff = (particle.destination.y - particle.y) / 180;
  var zDiff = (particle.destination.z - particle.z) / 180;
  var vel = new THREE.Vector3(xDiff, yDiff, zDiff);
  particle.velocity = vel;
};

var move = function(particle) {
  particle.x += particle.velocity.x;
  particle.y += particle.velocity.y;
  particle.z += particle.velocity.z;
  particle.updated += 1;
};

var slowDown = function(particle) {
  particle.velocity.x -= (particle.velocity.x / 300)
  particle.velocity.y -= (particle.velocity.y / 300)
  particle.velocity.z -= (particle.velocity.z / 300)
};

var resetProperties = function() {
  var pCount = particleCount;
  while (pCount--) {
    var particle = particles.vertices[pCount];
    particle.destination = null
    particle.updated = 0;
  };
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

var distributedZ = function(level) {
  var z;
  if (level === 1) {
    z = getRandomInt(50, 100);
  } else if (level === 2) {
    z = getRandomInt(350, 400);
  } else {
    z = getRandomInt(650, 700);
  }

  return z;
};

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

var disperse = function() {
  pCount = particleCount;
  for (var i = 0; i < pCount; i++) {
    var particle = particles.vertices[i];
    if (typeof(particle.destination) === "undefined") {
      var nums = [-1, 1];
      var x = particle.x + nums[Math.round(Math.random())];
      var y = particle.y - 1000;
      var z = Math.random() * 30 - 15;
      addDestination(particle, x, y, z);
      particle.velocity = new THREE.Vector3(x - particle.x, -3, z - particle.z);
    }

    if (particle.updated <= 300) {
      move(particle);
    } else {
      particles.vertices = shuffle(particles.vertices);
      resetProperties();
      dispersed = true;
      return;
    }
  }
}

var morphImageParticles = function(imageParticles, rgba) {
  for (var i = 0; i < imageParticles.length; i++) {
    var particle = imageParticles[i]
    if (particle.destination === null) {
      var pixelData = rgba[i];
      var x = pixelData[0];
      var y = pixelData[1];
      var z = Math.random() * 30 - 15;
      addDestination(particle, x, y, z);
      addVelocity(particle);
    }

    if (particle.updated <= 180) {
      move(particle);
    }
  }
};

var morphOuterParticles = function(outerParticles, ord) {
  for (var i = 0; i < outerParticles.length; i++) {
    var nums = [-1, 1]
    var particle = outerParticles[i];
    if (particle.destination === null) {
      var x = Math.random() * 1000 - 500;
      var y = Math.random() * 1000 - 500;
      var z;
      if (i <= Math.round(outerParticles.length * 0.6)) { // first 60%
        z = distributedZ(1)
      } else if (i > Math.round(outerParticles.length * 0.6) && i < Math.round(outerParticles.length * 0.9)) { // between 60% and 90%
        z = distributedZ(2)
      } else { // rest of 10%
        z = distributedZ(3);
      }

      addDestination(particle, x, y, z);
      addVelocity(particle);
    }

    if (particle.updated <= 600) {
      move(particle);
      slowDown(particle);
    } else {
      particles.vertices = shuffle(particles.vertices);
      resetProperties();
      if (ord === 1) {
        firstDone = true;
      } else if (ord === 2) {
        secondDone = true;
      } else {
        thirdDone = true;
      }
      return;
    }
  }
};

var makeImg = function(rgba, ord) {
  var pCount = particleCount;
  var imagePs = particles.vertices.slice(0, rgba.length);
  var outerPs = particles.vertices.slice(rgba.length, pCount);

  morphImageParticles(imagePs, rgba);
  morphOuterParticles(outerPs, ord);
};

var update = function() {
  if (thirdDone) {
    // something
  } else if (secondDone) {
    makeImg(tRgba, 3);
  } else if (firstDone) {
    makeImg(sRgba, 2);
  } else if (dispersed) {
    makeImg(fRgba, 1);
  } else {
    disperse();
  }

  particleSystem.geometry.verticesNeedUpdate = true;
  renderer.render(scene, camera);
  requestAnimationFrame(update);
  TWEEN.update()
}

var rotXScale = d3.scale.linear().domain([0, window.innerHeight]).range([15, -15]);
var rotYScale = d3.scale.linear().domain([0, window.innerWidth]).range([25, -25]);

d3.select("body").on("mousemove", function() {
  var scaledX = rotXScale(d3.mouse(this)[1]) * Math.PI / 180;
  var scaledY = rotYScale(d3.mouse(this)[0]) * Math.PI / 180;
  var tween = new TWEEN.Tween(particleSystem.rotation).to({ x: scaledX, y: scaledY, z: 0 })
  tween.easing( TWEEN.Easing.Quartic.Out);
  tween.start();
});

var img1 = new Image();
var img2 = new Image();
var img3 = new Image();
img1.onload = function() {
  drawImage(this, fRgba);

  img2.onload = function() {
    drawImage(this, sRgba);

    img3.onload = function() {
      drawImage(this, tRgba);
    }
    img3.src = "images/emo1.png";
  }
  img2.src = "images/batman.png";
  update();
}
img1.src = "images/emo2.png";
update();
