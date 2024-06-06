let edb = null

const SQL_CREATE_TABLE_RECORDS = 'CREATE TABLE IF NOT EXISTS `expense_records` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `eType` TEXT, `eAmount` DOUBLE, `eTime` TIMESTAMP, `addComment` TEXT,`tripId` INTEGER, FOREIGN KEY(`tripId`) REFERENCES `trip_records`(`id`))'
const SQL_INSERT_NEW_RECORD    = 'INSERT INTO `expense_records` (`eType`, `eAmount`, `eTime`, `addComment`, `tripId`) VALUES (?, ?, ?, ?, ?)'
const SQL_GET_ALL_RECORDS      = 'SELECT `id`, `eType`, `eAmount`, `eTime`, `addComment`,`tripId` FROM `expense_records` ORDER BY `eType`'
const SQL_DELETE_RECORD        = 'DELETE FROM `expense_records` WHERE `id`=?'
const SQL_UPDATE_RECORD        = 'UPDATE `expense_records` SET `eType`=?, `eAmount`=?, `eTime`=?, `addComment`=? WHERE `id`=?'
const SQL_GET_RECORD_BY_TRIPID = 'SELECT `id`, `eType`, `eAmount`, `eTime`, `addComment` FROM `expense_records` WHERE `tripId` = ? ORDER BY `eType`'

document.addEventListener('deviceready', function() {
    
    Zepto(function($){
        prepareDB()
        $('#btn-list-trip').on('click', function(){ window.location.href = 'trips.html' })
        $('#btn-add-expense').on('click', function(){
            openPage('addExpense', { id:0 }, function(data){
                $('#btn-list-expense').on('click', function(){backPage()})
                $('#button-form-save').on('click', function(){
                    let expense = $.trim($('#expenseType').val())
                    let amount  = $.trim($('#expenseAmount').val())
                    let time    = $.trim($('#expenseTime').val())
                    let comment = $.trim($('#expenseComments').val())
                    addRecord(expense, amount, time, comment)
                })
            })
        })
    })
})

function logError(title, code, message) {
    console.log(`${title} Error:`, `Code: ${code}`, `Mssg: ${message}`)
}

function prepareDB() {
    edb = window.sqlitePlugin.openDatabase(
        {name: 'expense.db', location: 'default'},
        function(edb) {
            edb.transaction(
                function(tx) {
                    tx.executeSql(SQL_CREATE_TABLE_RECORDS, [],
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

function addRecordValidation(expense, amount, time) {
  let emptyFields = []

  if(expense === '') {
    emptyFields.push('Expense Type')
    $('#tripNameError').show()
  }
  if(amount === '') {
    emptyFields.push('Total Amount')
    $('#tripDestinationError').show()
  }
  if(time === '') {
    emptyFields.push('Time of Expense')
    $('#tripStartDateError').show()
  }

  if(expense == '' ||amount == '' ||time == '') {
      alert({title:'Required Fields Empty',
      message:'Please fill in all the required fields!',
      class:'text-green',
      buttons:[{
        label:'OK',
        class:'text-red',
        onclick: () => closeAlert()}]
      })
      return false
  }
  return true
}

function getQueryParams(url) {
  let params = {}
  let parser = document.createElement('a')
  parser.href = url
  let query = parser.search.substring(1)
  let vars = query.split('&')
  for (let i = 0; i < vars.length; i++) {
      let pair = vars[i].split('=')
      params[pair[0]] = decodeURIComponent(pair[1])
  }
  return params
}

function addRecord(expense, amount, time, comment) {
  if (!addRecordValidation((expense, amount, time))) {
    return
  }
  if(!isDBReady()) return
  let params = getQueryParams(window.location.href)
  let tripId = params['tripId']
  edb.transaction(
    function(tx) {
        tx.executeSql(
            //SQL
            SQL_INSERT_NEW_RECORD,
            //arguments to SQL
            [expense, amount, time, comment, tripId],
            //success call back
            function(tx, results) {
                refreshList()
                console.log("Insert new record",tripId ,expense, amount, time, comment)
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
    $('#expenseType').val('')
    $('#expenseAmount').val('')
    $('#expenseTime').val('')
    $('#expenseComments').val('')
}

function refreshList() {
    if (!isDBReady()) return
    let params = getQueryParams(window.location.href)
    let tripId = params['tripId']
    edb.transaction( 
      function(tx) {
        tx.executeSql(
          SQL_GET_RECORD_BY_TRIPID, 
            [tripId], 
            function(tx, result) { 
              $('#list').empty()
              for(let i=0; i<result.rows.length; i++) {
              let h2 = $('<h2></h2>').text(`${result.rows.item(i).eTime}`)
              let p1 = $('<p></p>').text(`${result.rows.item(i).eType} - RM ${result.rows.item(i).eAmount}`)
              let p2 = $('<p></p>').text(`${result.rows.item(i).addComment}`)
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
                                          delRecord(result.rows.item(i).id) 
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
              let icon = $('<i></i>')
                            .addClass('icon ion-trash-b red')
                            
              innerDiv.append(icon)
  
              let outerDiv = $('<div></div>')
                              .addClass('item')
                              .on('click', function(){ 
                                openPage(
                                  'addExpense', 
                                  {
                                    id:result.rows.item(i).id,
                                    type:result.rows.item(i).eType, 
                                    amount:result.rows.item(i).eAmount,
                                    time:result.rows.item(i).eTime,
                                    comment:result.rows.item(i).addComment
                                  }, 
                                    //(`eType` TEXT, `eAmount` DOUBLE, `eTime` TIMESTAMP, `addComment` TEXT)'
                                  function(data){
                                    $('#expenseType').val(data.type)
                                    $('#expenseAmount').val(data.amount)
                                    $('#expenseTime').val(data.time)
                                    $('#expenseComments').val(data.comment)
                                    $('#btn-list-expense').on('click', function(){ backPage() })
                                    $('#button-form-save').on('click', function(){
                                      updateRecord(result.rows.item(i).id)
                                    })
                                    
                                  }
                                )
                              })
              outerDiv.append(h2)
              outerDiv.append(p1)
              outerDiv.append(p2)
              outerDiv.append(innerDiv)
              $('#list').append(outerDiv)
            }
          }, 
          function(tx, error) { logError('refreshList()::executeSql()', error.code, error.message) }
        )
      }, 
      function(error) { logError('refreshList()::transaction()', error.code, error.message) }
    )
}

function updateRecord(id) {
    if(!isDBReady()) return
    let expense = $.trim($('#expenseType').val())
    let amount  = $.trim($('#expenseAmount').val())
    let time    = $.trim($('#expenseTime').val())
    let comment = $.trim($('#expenseComments').val())
    edb.transaction(
        function(tx) {
            tx.executeSql(
                SQL_UPDATE_RECORD,
                [expense, amount, time, comment, id],
                function(tx, results) {refreshList(), backPage()},
                function(tx, error) {logError('updateRecord()::executeSql()', error.code, error.message)}
            )
        },
        function(error) {logError('updateRecord()::transaction()', error.code, error.message)}
      )
}

function delRecord(id) {
    if(!isDBReady()) return
    edb.transaction(
        function(tx) {
            tx.executeSql(
                SQL_DELETE_RECORD,
                [id],
                function(tx, results) {refreshList()},
                function(tx, error) {logError('delRecord()::executeSql()', error.code, error.message)}
            )
        },
        function(error) {logError('delRecord()::transaction()', error.code, error.message)}
      )
}

function isDBReady() {
  return edb != null
}
