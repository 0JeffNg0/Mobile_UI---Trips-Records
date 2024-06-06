let tdb = null

const SQL_CREATE_TABLE_TRIPS = 'CREATE TABLE IF NOT EXISTS `trip_records` (`tripId` INTEGER PRIMARY KEY AUTOINCREMENT, `tName` TEXT, `tDest` TEXT, `strDate` TIMESTAMP, `endDate` TIMESTAMP, `tRisk` TEXT, `tTel` TEXT, `tTransport` TEXT, `desc` TEXT)'
const SQL_INSERT_NEW_TRIP    = 'INSERT INTO `trip_records` (`tName`, `tDest`, `strDate`, `endDate`, `tRisk`, `tTel`, `tTransport`, `desc`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
const SQL_GET_ALL_TRIPS      = 'SELECT `tripId`, `tName`, `tDest`, `strDate`, `endDate`, `tRisk`, `tTel`, `tTransport`, `desc` FROM `trip_records` ORDER BY `tName`'
const SQL_DELETE_TRIP        = 'DELETE FROM `trip_records` WHERE `tripId`=?'
const SQL_UPDATE_TRIP        = 'UPDATE `trip_records` SET `tName`=?, `tDest`=?, `strDate`=?, `endDate`=?, `tRisk`=?, `tTel`=?, `tTransport`=?, `desc`=?, WHERE `tripId`=?'
const SQL_SEARCH_TRIP        = 'SELECT `tripId`, `tName`, `tDest`, `strDate`, `endDate`, `tRisk`, `tTel`, `tTransport`, `desc` FROM `trip_records` WHERE `tName` LIKE ?'

document.addEventListener('deviceready', function() {
    
    Zepto(function($){
        prepareDB()
        $('#search').on('keyup click', function(event){
          if (event.type === 'click') {
              $(this).css('outline-color', 'primary')
              console.log('Clicked search bar')
          } else if (event.type === 'keyup') {
              searchRecord($(this).val())
          }
        })
      
        $('#title').on('click', function() {
          location.reload()
        })

        $('#btn-upload-cloud').on('click', function() {
          uploadTrip()
        })

        $('#btn-add-list').on('click', function(){
            openPage('addTrip', { tripId:0 }, function(data){
                $('#btn-list-trip').on('click', function(){backPage()})
                $('#btn-form-save').on('click', function(){
                    let trip        = $.trim($('#tripName').val())
                    let destination = $.trim($('#tripDestination').val())
                    let datestr     = $.trim($('#tripStartDate').val())
                    let dateend     = $.trim($('#tripEndDate').val())
                    let riskassess  = $.trim($('#tripRiskAss').val())
                    let contact     = $.trim($('#tripContact').val())
                    let transport   = $.trim($('#tripTransport').val())
                    let description = $.trim($('#tripDescription').val())
                    addRecord(trip, destination, datestr, dateend, riskassess, contact, transport, description)
                })
                $('#btn-take-pic').on('click', function () {
                  navigator.camera.getPicture(onPhotoSuccess, onPhotoFail, {
                      quality: 50,
                      destinationType: Camera.DestinationType.DATA_URL,
                      encodingType: Camera.EncodingType.JPEG,
                      saveToPhotoAlbum: true
                  })
              })
              document.getElementById('expensePhoto').addEventListener('change', function () {
                var input = this;
                if (input.files && input.files[0]) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var img = document.getElementById('pictureList');
                        img.src = e.target.result
                        img.style.display = "block"
                    }
                    reader.readAsDataURL(input.files[0])
                }
            })
            })
        })
    })
})

function uploadTrip() {
  console.log("Uploading trip");
  var payload = {
      userId: "SCKL2000174",
      detailList: []
  }

  tdb.transaction(function(tx) {
    tx.executeSql(SQL_GET_ALL_TRIPS, [], function(tx, result) {
        for(let i = 0; i < result.rows.length; i++) {
            var trip = result.rows.item(i)
            payload.detailList.push({
                name: trip.tName,
                data: {}
            })
        }
        console.log("Trips' Details: ", payload.detailList)

        // Move the HTTP request here
        window['cordova']['plugin']['http'].setDataSerializer('json')
        window['cordova']['plugin']['http'].post('https://bcomp3402.porky.lol/', { jsonpayload: payload }, {}, 
            function(response) {
                var responseData = JSON.parse(response.data)
                var shortResponse = {
                    status: response.status,
                    userId: responseData.userId,
                    number: responseData.number,
                    names: responseData.names
                }

                var textColor = response.status === 200 ? "green" : "red"
                
                alert(
                  "Response: \n" +
                  "Status: " + shortResponse.status + "\n" +
                  "User ID: " + shortResponse.userId + "\n" +
                  "Number: " + shortResponse.number + "\n" +
                  "Names: " + shortResponse.names.join(", "))

                document.querySelector(".alert").style.color = textColor
                console.log("Response: " + JSON.stringify(shortResponse))
            },
            function(error) {
                console.log("Error: " + JSON.stringify(error))
                alert("Error: " + JSON.stringify(error))
            }
        )
    }, function(error) {
        console.log('Error occurred while getting trips.', error)
    })
})
}

function logError(title, code, message) {
    console.log(`${title} Error:`, `Code: ${code}`, `Mssg: ${message}`)
}

function prepareDB() {
    tdb = window.sqlitePlugin.openDatabase(
        {name: 'trip.db', location: 'default'},
        function(tdb) {
            tdb.transaction(
                function(tx) {
                    tx.executeSql(SQL_CREATE_TABLE_TRIPS, [],
                    function(tx, results) {
                        refreshList()
                    },
                    function(tx, error) {logError('openDatabase()::executeSql()', error.code, error.message)})
                },
                function(error) {logError('openDatabase()::transaction()', error.code, error.message)}
            )
        },
        function(error) {logError('openDatabase()', error.code, error.message)}
    )
}

function addRecordValidation(trip, destination, datestr, dateend, riskassess, contact, transport) {
  let emptyFields = []

  if(trip === '') {
    emptyFields.push('Name of Trip')
    $('#tripNameError').show()
  }
  if(destination === '') {
    emptyFields.push('Destination')
    $('#tripDestinationError').show()
  }
  if(datestr === '') {
    emptyFields.push('Start Date of Trip')
    $('#tripStartDateError').show()
  }
  if(dateend === '') {
    emptyFields.push('End Date of Trip')
    $('#tripEndDateError').show()
  }
  if(riskassess === '') {
    emptyFields.push('Risk Assessment')
    $('#tripRiskAssError').show()
  }
  if(contact === '') {
    emptyFields.push('Contact Number')
    $('#tripContactNumError').show()
  }
  if(transport === ''){ 
    emptyFields.push('Mode of Transportation')
    $('#tripTransportError').show()
  }

  if(emptyFields.length > 0) {
    alert({
      title:'Required Fields Empty',
      message:`The following fields are required: ${emptyFields.join(', ')}`,
      class:'text-green',
      buttons:[{
        label:'OK',
        class:'text-red',
        onclick: () => closeAlert()
      }]
    })
    return false
  }
  return true
}

function addRecord(trip, destination, datestr, dateend, riskassess, contact, transport, description) {
  if (!addRecordValidation(trip, destination, datestr, dateend, riskassess, contact, transport)) {
    return
  }
  if(!isDBReady()) return
  tdb.transaction(
    function(tx) {
        tx.executeSql(
            //SQL
            SQL_INSERT_NEW_TRIP,
            //arguments to SQL
            [trip, destination, datestr, dateend, riskassess, contact, transport, description],
            //success call back
            function(tx, results) {
                refreshList()
                backPage()
            },
            //error call back
            function(tx, error) {
                logError('addRecord()::executeSql()', error.code, error.message)}
        )
    },
    function(error) {logError('addRecord()::transaction()', error.code, error.message)}
  )
}

function clearForm() {
  $('#tripName').val('')
  $('#tripDestination').val('')
  $('#tripStartDate').val('')
  $('#tripEndDate').val('')
  $('#tripRiskAss').val('')
  $('#tripContact').val('')
  $('#tripTransport').val('')
  $('#tripDescription').val('')
}

function refreshList() {
    if (!isDBReady()) return
    tdb.transaction( 
      function(tx) {
        tx.executeSql(
            SQL_GET_ALL_TRIPS, 
            [], 
            function(tx, result) { 
              $('#listTrip').empty()
              for(let i=0; i<result.rows.length; i++) {
              let h2 = $('<h2></h2>').text(`${result.rows.item(i).tName} - ${result.rows.item(i).tDest}`)
              let p1 = $('<p></p>').text(`${result.rows.item(i).strDate} - ${result.rows.item(i).endDate}`)
              let p2 = $('<p></p>').text(`Risk Assessment: ${result.rows.item(i).tRisk}`)
              let p3 = $('<p></p>').text(`Tel: ${result.rows.item(i).tTel} - ${result.rows.item(i).tTransport}`)
              let p4 = $('<p></p>').text(`${result.rows.item(i).desc}`)
              let div = $('<div></div>')
                          .addClass('right')
                          .on('click', (
                            function(i) {
                            return function(e) {
                              e.stopPropagation()
                              let tripId = result.rows.item(i).tripId
                              window.location.href = 'expenses.html?tripId=' + tripId
                              console.log ("trip id",tripId)
                            }
                          })
                          (i)
                        )
              let innerDiv = $('<div></div>')
                                .addClass('right')
                                .on('click', function(e){ 
                                  e.stopPropagation()
                                  alert({
                                    title:'Delete Record',
                                    message:'Confirm?',
                                    class:'blue',
                                    buttons:[
                                      {
                                        label: 'Yes',
                                        class:'text-red', 
                                        onclick: function() { 
                                          delRecord(result.rows.item(i).tripId) 
                                          closeAlert()
                                        }
                                      },
                                      {
                                        label:'No',
                                        class:'text-white', 
                                        onclick: () => closeAlert()
                                      }
                                    ]
                                  })
                                })

                                let navigateIcon = $('<i></i>')
                                  .addClass('icon ion-compose pe-5')
                                div.append(navigateIcon)
                                
                                let deleteIcon = $('<i></i>')
                                  .addClass('icon ion-trash-b red')
                                innerDiv.append(deleteIcon)
              
                        let outerDiv = $('<div></div>')
                              .addClass('item')
                              .on('click', function(){ 
                                openPage(
                                  'addTrip', 
                                  {
                                    id:result.rows.item(i).tripId,
                                    trip:result.rows.item(i).tName, 
                                    destination:result.rows.item(i).tDest,
                                    datestr:result.rows.item(i).strDate,
                                    dateend:result.rows.item(i).endDate,
                                    riskassess:result.rows.item(i).tRisk,
                                    contact:result.rows.item(i).tTel,
                                    transport:result.rows.item(i).tTransport,
                                    description:result.rows.item(i).desc,
                                  }, 
                                  //(`tName` TEXT, `tDest` TEXT, `strDate` TIMESTAMP, `endDate` TIMESTAMP, `tRisk` TEXT, `tTel` TEXT, `tTransport` TEXT `desc` TEXT)'
                                  function(data){
                                    $('#tripName').val(data.trip)
                                    $('#tripDestination').val(data.destination)
                                    $('#tripStartDate').val(data.datestr)
                                    $('#tripEndDate').val(data.dateend)
                                    $('#tripRiskAss').val(data.riskassess)
                                    $('#tripContact').val(data.contact)
                                    $('#tripTransport').val(data.transport)
                                    $('#tripDescription').val(data.description)
                                    $('#btn-list-trip').on('click', function(){ backPage() })
                                    $('#btn-form-save').on('click', function(){
                                      updateRecord(data.id)
                                    })
                                    
                                  }
                                )
                              })
              outerDiv.append(h2)
              outerDiv.append(p1)
              outerDiv.append(p2)
              outerDiv.append(p3)
              outerDiv.append(p4)
              outerDiv.append(div)
              outerDiv.append(innerDiv)
              $('#listTrip').append(outerDiv)
            }
          }, 
          function(tx, error) { logError('refreshList()::executeSql()', error.code, error.message) }
        )
      }, 
      function(error) { logError('refreshList()::transaction()', error.code, error.message) }
    )
}

function updateRecord(tripId) {
    if(!isDBReady()) return
    let trip        = $.trim($('#tripName').val())
    let destination = $.trim($('#tripDestination').val())
    let datestr     = $.trim($('#tripStartDate').val())
    let dateend     = $.trim($('#tripEndDate').val())
    let riskassess  = $.trim($('#tripRiskAss').val())
    let contact     = $.trim($('#tripContact').val())
    let transport   = $.trim($('#tripTransport').val())
    let description = $.trim($('#tripDescription').val())
    tdb.transaction(
        function(tx) {
            tx.executeSql(
              SQL_UPDATE_TRIP,
                [trip, destination, datestr, dateend, riskassess, contact, transport, description, tripId],
                function(tx, results) {
                  console.log("Update Record", trip, destination, datestr, dateend, riskassess, contact, transport, description, tripId)
                  refreshList(), backPage()},
                function(tx, error) {logError('updateRecord()::executeSql()', error.code, error.message)}
            )
        },
        function(error) {logError('updateRecord()::transaction()', error.code, error.message)}
      )
}

function delRecord(tripId) {
    if(!isDBReady()) return
    tdb.transaction(
        function(tx) {
            tx.executeSql(
              SQL_DELETE_TRIP,
                [tripId],
                function(tx, results) {refreshList()},
                function(tx, error) {logError('delRecord()::executeSql()', error.code, error.message)}
            )
        },
        function(error) {logError('delRecord()::transaction()', error.code, error.message)}
      )
}

function searchRecord(trip) {
  if (!isDBReady()) return

  tdb.transaction(function(tx) {
    tx.executeSql(
      SQL_SEARCH_TRIP, 
      ['%' + trip + '%'], 
      function(tx, result) {
        $('#listTrip').empty() 
        for (let i = 0; i < result.rows.length; i++) {
          // Create elements for each search result
          let tripItem = result.rows.item(i)
          let outerDiv = $('<div></div>').addClass('item')
          let h2 = $('<h2></h2>').text(`${result.rows.item(i).tName} - ${result.rows.item(i).tDest}`)
          let p1 = $('<p></p>').text(`${result.rows.item(i).strDate} - ${result.rows.item(i).endDate}`)
          let div = $('<div></div>')
                          .addClass('right')
                          .on('click', (
                            function(i) {
                            return function(e) {
                              e.stopPropagation()
                              let tripId = result.rows.item(i).tripId
                              window.location.href = 'expenses.html?tripId=' + tripId
                              console.log ("trip id",tripId)
                            }
                          })
                          (i)
                        )
              let innerDiv = $('<div></div>')
                                .addClass('right')
                                .on('click', function(e){ 
                                  e.stopPropagation()
                                  alert({
                                    title:'Delete Record',
                                    message:'Confirm?',
                                    class:'blue',
                                    buttons:[
                                      {
                                        label: 'Yes',
                                        class:'text-red', 
                                        onclick: function() { 
                                          delRecord(result.rows.item(i).tripId) 
                                          closeAlert()
                                        }
                                      },
                                      {
                                        label:'No',
                                        class:'text-white', 
                                        onclick: () => closeAlert()
                                      }
                                    ]
                                  })
                                })

                                let navigateIcon = $('<i></i>')
                                  .addClass('icon ion-compose pe-5')
                                div.append(navigateIcon)
                                
                                let deleteIcon = $('<i></i>')
                                  .addClass('icon ion-trash-b red')
                                innerDiv.append(deleteIcon)

          // Attach click event to open detailed view
          outerDiv.on('click', function() {
            openPage('addTrip', {
              id: tripItem.tripId,
              trip: tripItem.tName,
              destination: tripItem.tDest,
              datestr: tripItem.strDate,
              dateend: tripItem.endDate,
              riskassess: tripItem.tRisk,
              contact: tripItem.tTel,
              transport: tripItem.tTransport,
              description: tripItem.desc,
            }, function(data) {
              // Update form fields and attach event handlers
              $('#tripName').val(data.trip)
              $('#tripDestination').val(data.destination)
              $('#tripStartDate').val(data.datestr)
              $('#tripEndDate').val(data.dateend)
              $('#tripRiskAss').val(data.riskassess)
              $('#tripContact').val(data.contact)
              $('#tripTransport').val(data.transport)
              $('#tripDescription').val(data.description)
              $('#btn-list-trip').on('click', function() { backPage() })
              $('#btn-form-save').on('click', function() { updateRecord(data.id) })
            })
          })

          // Append elements to the container
          outerDiv.append(h2, p1)
          outerDiv.append(div)
          outerDiv.append(innerDiv)
          $('#listTrip').append(outerDiv)
        }
      },
      function(tx, error) { // Error callback for SQL execution
        logError('searchRecord()::executeSql()', error.code, error.message)
      }
    )
  },
  function(error) { // Error callback for transaction
    logError('searchRecord()::transaction()', error.code, error.message)
  })
}

function onPhotoSuccess(imageData) {
  var img = document.getElementById('pictureList')
  img.src = "data:image/jpeg;base64," + imageData;
  img.style.display = "block"

  var input = document.getElementById('expensePhoto')
  input.value = "data:image/jpeg;base64," + imageData
}

function onPhotoFail(message) {
  console.log('Failed because: ' + message)
}

function getOptions() {
  return {
      quality             : 100,
      targetWidth         : 1920,
      destinationType     : Camera.DestinationType.FILE_URI,
      sourceType          : Camera.PictureSourceType.CAMERA,
      encodingType        : Camera.EncodingType.JPEG,
      mediaType           : Camera.MediaType.PICTURE,
      allowEdit           : false,
      correctOrientation  : true
  }
}

function isDBReady() {
  return tdb != null
}
