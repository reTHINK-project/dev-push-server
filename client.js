const publicVapidKey = 'BKlOPcEel9zWecQsMCCwmaGIR7Sn6R85d5GSferRw3O8MMBbVeyjsUUynoKwOtnKAdWwYyhHtN-zp7NsWSMq7MQ';
const serverURL = 'http://localhost:3000';

if ('serviceWorker' in navigator) {
  run().catch(error => console.error(error));
}

function createPOST(method) {

  return serverURL + method, {
    method: 'POST',
    body: '',
    headers: {
      'content-type': 'application/json'
    }
  }

}

window.onload = prepareButtons;

function prepareButtons() {

  document.getElementById("subscribe").onclick = function () {
    fetch(serverURL + "/subscribe", {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'content-type': 'application/json'
      }
    })
      .then(function (data) {
        // Here you get the data to modify as you please
        console.log('sent');

      })
      .catch(function (error) {
        // If there is any error you will catch them here
      });
  };


  document.getElementById("delete").onclick = function () {
    fetch(serverURL + "/delete", {
      method: 'POST',
      body: '',
      headers: {
        'content-type': 'application/json'
      }
    })
      .then(function (data) {
        // Here you get the data to modify as you please
        console.log('deleted');

      })
      .catch(function (error) {
        // If there is any error you will catch them here
      });
  };

  document.getElementById("send").onclick = function () {
    fetch(serverURL + "/send", {
      method: 'POST',
      body: '',
      headers: {
        'content-type': 'application/json'
      }
    })
      .then(function (data) {
        console.log('sent');
      });
  };
}


async function run() {
  const registration = await navigator.serviceWorker.
    register('/worker.js', { scope: '/' });

  subscription = await registration.pushManager.
    subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });
}

// Boilerplate borrowed from https://www.npmjs.com/package/web-push#using-vapid-key-for-applicationserverkey
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
