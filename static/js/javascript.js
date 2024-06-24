
//------------
// VARIABLES:
//------------

var sortOrder = "desc"; // sorting order for table columns
var loaderVisible = false; // Flag to track if the loader is currently visible

// -------------
// ERROR MODAL:
// -------------

function showErrorModal(message, error, statusCode) {
    /*
    Function to show error modal with message, error description and status code
    - shows the overlay to prevent user interaction with the page outside the modal
    - message: error message
    - error: error description
    - statusCode: status code of the error
    */
        $('#errorModal, #overlay').show();
        $('#error-message').text(message);
        $('#error-description').text(error);
        $('#error-status-code').text('Status code ' + statusCode);
        modal = document.getElementById("errorModal");
        modal.style.display = 'block';
        removeLoader();
    };

function closeErrorModal() {
    /*
    This function closes the error modal
    - removes the overlay and hides the modal
    */
    modal = document.getElementById("errorModal");
    modal.style.display = 'none';
    $('#errorModal, #overlay').hide();
};

//---------------------
// EDIT PROJECT MODAL:
//---------------------

function showEditModal(guid) {
    /*
    Function to show the edit project modal
    - shows the overlay to prevent user interaction with the page outside the modal
    */
    $("#edit-overlay-" + guid).show();
    modal = document.getElementById("edit_project_modal_" + guid);
    modal.style.display = 'block';
};

function closeEditModal(guid) {
    /*
    Function to close the edit project modal
    - removes the overlay and hides the modal
    */
    modal = document.getElementById("edit_project_modal_" + guid);
    modal.style.display = 'none';
    $("#edit-overlay-" + guid).hide();
};

// ----------------------------
// SUBMIT PERIODISATION MODAL:
// ----------------------------

function showSubmitModal(guid) {
    /*
    Function to show the submit periodisation modal
    - shows the overlay to prevent user interaction with the page outside the modal
    */
    $("#submit-overlay-" + guid).show();
    modal = document.getElementById("submit_modal_" + guid);
    modal.style.display = 'block';
};

function closeSubmitModal(guid) {
    /*
    Function to close the submit periodisation modal
    - removes the overlay and hides the modal
    */
    modal = document.getElementById("submit_modal_" + guid);
    modal.style.display = 'none';
    $("#submit-overlay-" + guid).hide();
};

// ---------------------------
// HIDE/UNHIDE PROJECT MODAL:
// ---------------------------

function showHideModal(pid) {
    /*
    Function to show the hide project modal
    - shows the overlay to prevent user interaction with the page outside the modal
    */
    $("#hide-overlay-" + pid).show();
    modal = document.getElementById("hide_project_modal_" + pid);
    modal.style.display = 'block';
};

function closeHideModal(pid) {
    /*
    Function to close the hide project modal
    - removes the overlay and hides the modal
    */
    modal = document.getElementById("hide_project_modal_" + pid);
    modal.style.display = 'none';
    $("#hide-overlay-" + pid).hide();
};

function showConfirmHideModal(pid) {
    /*
    Function to show the confirm hide project modal
    - shows the overlay to prevent user interaction with the page outside the modal
    */
    $("#confirm-hide-overlay-" + pid).show();
    modal = document.getElementById("confirm_hide_project_modal_" + pid);
    modal.style.display = 'block';
};

function closeConfirmHideModal(pid) {
    /*
    Function to close the confirm hide project modal
    - removes the overlay and hides the modal
    */
    modal = document.getElementById("confirm_hide_project_modal_" + pid);
    modal.style.display = 'none';
    $("#confirm-hide-overlay-" + pid).hide();
};

function showConfirmUnHideModal(pid) {
    /*
    Function to show the confirm un-hide project modal
    - shows the overlay to prevent user interaction with the page outside the modal
    */
    $("#confirm-unhide-overlay-" + pid).show();
    modal = document.getElementById("confirm_unhide_project_modal_" + pid);
    modal.style.display = 'block';
};

function closeConfirmUnHideModal(pid) {
    /*
    Function to close the confirm un-hide project modal
    - removes the overlay and hides the modal
    */
    modal = document.getElementById("confirm_unhide_project_modal_" + pid);
    modal.style.display = 'none';
    $("#confirm-unhide-overlay-" + pid).hide();
};

// ---------------------------
// MAX ALLOCATION INFO MODAL:
// ---------------------------

function showMaxAllocInfoModal(guid) {
    /*
    Function to show the max allocation info modal when allocation is over 100% (max limit)
    - shows the overlay to prevent user interaction with the page outside the modal
    - the modal is shown for 10 seconds and then automatically closed
    - submit button is disabled when allocation is over 100%
    - user needs to adjust the allocation to be under 100% to enable the submit button again
    */
    $("#max-alloc-overlay-" + guid).show();
    var x = document.getElementById('max-allocation-info-modal-' + guid);
    x.style.display = "block";
    setTimeout(function(){ x.style.display = "none"; hideMaxAllocInfoModal(guid);}, 10000);
};

function hideMaxAllocInfoModal(guid) {
    /*
    Function to hide the max allocation info modal
    - removes the overlay and hides the modal
    */
    var x = document.getElementById('max-allocation-info-modal-' + guid);
    x.style.display = "none";
    $("#max-alloc-overlay-" + guid).hide();
};

//--------------------
// EDIT PROJECT AJAX:
//--------------------

$(document).ready(function(){
    $('.edit_project').click(function(){
        var guid = $(this).data('guid'); // project guid
        var pid = $(this).data('pid'); // project id
        var cv = $(this).data('cv'); // contract value
        var cc = $(this).data('cc'); // currency code
        var p_idx = $(this).data('period-idx'); // period index
        var p_year = $(this).data('year'); // period year
        var p_sts = $(this).data('period-start-ts'); // period start timestamp
        var p_ets = $(this).data('period-end-ts'); // period end timestamp
        showLoader();

        $.ajax({
            type: 'post',
            url: '/edit_project/' + pid + '/',
            contentType: 'application/json',
            data: JSON.stringify({guid: guid, pid: pid, contract_value: cv, currency: cc,
                per_idx: p_idx, year: p_year, period_start_ts: p_sts, period_end_ts: p_ets}),
            success: function(data){
                $('.modal-body-' + guid).html(data);
                $('.modal-body-' + guid).append(data.htmlresponse);
                showEditModal(guid); // open edit modal
            },
            error: function(xhr, status, error){
                var statusCode = xhr.status;
                showErrorModal('Edit operation failed!', error, statusCode);
            },
            complete: function() {
                removeLoader(); // remove loading spinner
            }
        });
    });
});

//----------------------------
// SUBMIT PERIODISATION AJAX:
//----------------------------

$(document).ready(function(){
    $('.submit_periodisation').click(function(){
        var guid = $(this).data('guid'); // project guid
        var pid = $(this).data('pid'); // project id
        var ue = $(this).data('ue'); // user email address
        var map = $(this).data('map'); // mappings data
        var p_idx = $(this).data('period-idx'); // period index
        var pp_data = getPeriodisationData(guid); // fetch pp data from table
        showLoader();

        $.ajax({
            type: 'post',
            url: '/set_periodisation/' + pid + '/',
            contentType: 'application/json',
            data: JSON.stringify({guid: guid, pid: pid, user_email: ue, pp_data: pp_data, mappings: map,
                per_idx: p_idx}),
            success: function(data){
                $('.modal-body-submit-' + guid).html(data);
                $('.modal-body-submit-' + guid).append(data.htmlresponse);
                showSubmitModal(guid); // open submit modal
            },
            error: function(xhr, status, error){
            var statusCode = xhr.status;
                showErrorModal('Submit operation failed!', error, statusCode);
            },
            complete: function() {
                removeLoader(); // remove loading spinner
            }
        });
    });
});

//---------------------
// HIDE PROJECT AJAX:
//---------------------

$(document).ready(function(){
    $('.confirm_hide_project').click(function(){
        var pid = $(this).data('pid'); // project id
        var ue = $(this).data('ue'); // user email address
        closeHideModal(pid); // close hide modal
        showLoader();  // show loading spinner

        $.ajax({
            type: 'post',
            url: '/confirm_hide/' + pid + '/',
            contentType: 'application/json',
            data: JSON.stringify({pid: pid, user_email: ue}),
            success: function(data){
                $('.modal-body-hide-confirm-' + pid).append(data.htmlresponse);
                showConfirmHideModal(pid); // show confirm hide modal
            },
            error: function(xhr, status, error){
            var statusCode = xhr.status;
                showErrorModal('Hide operation failed!', error, statusCode);
            },
            complete: function() {
                removeLoader(); // remove loading spinner
                enableViewAllButton(); // enable view all projects button
            }
        });
    });
});

// ----------------------
// UNHIDE PROJECT AJAX:
// ----------------------

$(document).ready(function(){
    // Attach the event listener to a common ancestor
    $(document).on('click', '.unhide-button', function(){
        var pid = $(this).data('pid'); // project id
        var ue = $(this).data('ue'); // user email address
        showLoader();  // show loading spinner

        $.ajax({
            type: 'post',
            url: '/confirm_unhide/' + pid + '/',
            contentType: 'application/json',
            data: JSON.stringify({pid: pid, user_email: ue}),
            success: function(data){
                $('.modal-body-unhide-confirm-' + pid).append(data.htmlresponse);
                showConfirmUnHideModal(pid); // show confirm un-hide modal
            },
            error: function(xhr, status, error){
                var statusCode = xhr.status;
                showErrorModal('Un-hide operation failed!', error, statusCode);
            },
            complete: function() {
                removeLoader(); // remove loading spinner
            }
        });
    });
});


//-------------------------
// MAX ALLOCATION CHECKER:
//-------------------------

function checkMaxAllocation(guid) {
    /*
    Function to check if the total allocation is over 100% in the periodisation table
    - if the total allocation is over 100%, show the max allocation info modal
    - if so, disable the submit button until the allocation is adjusted by user and it's under 100%
    */
    var periodTable = document.getElementById("project_workhours_period_table_" +  guid);
    var maxAllocation = 100;
    var totalAllocation = 0;
    var rows = periodTable.rows;
    for (var i = 1; i < rows.length -1; i++) {
        var row = rows[i];
        var allocation = parseFloat(row.cells[2].textContent);
        totalAllocation += allocation;
    };

    if (totalAllocation > maxAllocation) {
        // show info modal that allocation is over 100%
        showMaxAllocInfoModal(guid);
        // disable submit button
        disableSubmitButton(guid);
        }
        else {
        // enable submit button
        enableSubmitButton(guid)
        };
};

function disableSubmitButton(project_guid) {
    /*
    Function to disable the submit button in the periodisation table
    */
    document.getElementById("submit_changes_btn_" + project_guid.toString()).disabled = true;
};

function enableSubmitButton(project_guid) {
    /*
    Function to enable the submit button in the periodisation table
    */
    document.getElementById("submit_changes_btn_" + project_guid.toString()).disabled = false;
};

//---------------------
// SORT TABLE COLUMNS:
//---------------------

function sortTable(table_id, n, isNumeric = false) {
    /*
    Function to sort the table columns in ascending or descending order
    - table_id: id of the table to be sorted
    - n: index of the column to be sorted
    - isNumeric: boolean flag to indicate if the column is numeric
    */
    let table = document.getElementById(table_id);
    let rows, i, x, y, count = 0;
    let switching = true;
    let orderArray = [];
    let Switch;

    if (orderArray[n] === undefined) {
        orderArray[n] = 'ascending';
    } else {
        orderArray[n] = orderArray[n] === 'ascending' ? 'descending' : 'ascending';
    }

    while (switching) {
        switching = false;
        rows = table.rows;

        for (i = 1; i < rows.length - 1; i++) {
          Switch = false;
          let xContent, yContent;

          // Adjust index to include TH element for the first column
          x = n === 0 ? rows[i].getElementsByTagName('TH')[0] : rows[i].getElementsByTagName('TD')[n - 1];
          y = n === 0 ? rows[i + 1].getElementsByTagName('TH')[0] : rows[i + 1].getElementsByTagName('TD')[n - 1];

          if (x && y) {
            if (isNumeric) {
              xContent = parseFloat(x.textContent.trim()) || 0; // Parse content as float
              yContent = parseFloat(y.textContent.trim()) || 0;
            } else {
              xContent = x.textContent.trim().toLowerCase();
              yContent = y.textContent.trim().toLowerCase();
            }

            if (orderArray[n] == 'ascending') {
              if (xContent > yContent) {
                Switch = true;
                break;
              }
            } else if (orderArray[n] == 'descending') {
              if (xContent < yContent) {
                Switch = true;
                break;
              }
            }
          }
        }
        if (Switch) {
          rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
          switching = true;
          count++;
        } else {
          if (count == 0 && orderArray[n] == 'ascending') {
            orderArray[n] = 'descending';
            switching = true;
          }
        }
    };
};

//-------------------------------------
// SEARCH SUBSTRING IN PROJECTS TABLE:
// ------------------------------------

function searchInTable() {
    /*
    Function to search for a substring in the projects table
    - get the input value and convert it to uppercase
    - get the table, tbody, tr, td elements
    - loop through all table rows and hide those who don't match the search query
    */
    var input, btn, filter, table, tbody, tr, td, i;
    input = document.getElementById("search");
    filter = input.value.toUpperCase();
    table = document.getElementById("sortable");
    tbody = table.getElementsByTagName("tbody")[0]; // get the first tbody element
    tr = tbody.getElementsByTagName("tr");
    btn = document.getElementById("view_all_projects_button");

    // Loop through all table rows in the tbody, and hide those who don't match the search query
    for (i = 0; i < tr.length; i++) {

        // exclude rows that have class "hidden-by-user" from search if hidden projects are not shown:
        if (btn.innerText === "Vise skjult" && tr[i].classList.contains("hidden-by-user")) {
            continue;
        } else {

            td = tr[i];
            if (td) {
              if (td.innerHTML.toUpperCase().indexOf(filter) > -1) {
                tr[i].classList.remove("hidden"); // show matching rows
              } else {
                tr[i].classList.add("hidden"); // hide non-matching rows
                    }
                }
            }
        }
    };

//-------------------------------------------
// CLEAR SEARCH BAR WHEN ESC KEY IS PRESSED:
//-------------------------------------------

function clearSearchOnEscape(evt, input) {
    /*
    Function to clear the search input when the escape key (key code is 27) is pressed
    */
    if (evt.keyCode == 27) {
        clearSearchInput();
    }
};

function clearSearchInput() {
    /*
    Function to clear the search input and reset the table after search
    */
    var getValue = document.getElementById("search");
    if (getValue.value !="") {
        getValue.value = "";
        resetTableAfterSearch();
    }
};

function resetTableAfterSearch() {
    /*
    Function to reset the table after search
    - get the table, tbody, tr elements
    - loop through all table rows and show those that were hidden during search
    */
    var table, tbody, tr, td, i;
    table = document.getElementById("sortable");
    tbody = table.getElementsByTagName("tbody")[0];
    tr = tbody.getElementsByTagName("tr");
    btn = document.getElementById("view_all_projects_button");

    // Loop through all table rows:
    for (i = 0; i < tr.length; i++) {
        // Exclude rows that have class "hidden-by-user" if hidden projects are not shown:
        if (btn.innerText === "Vise skjult" && tr[i].classList.contains("hidden-by-user")) {
            continue;
        } else {
            tr[i].classList.remove("hidden");
        }
    };
};

//-----------------------
// TOGGLE DROPDOWN LIST:
//-----------------------

function toggleDD(myDropMenu) {
    /*
    Function to toggle the dropdown list visibility
    - myDropMenu: id of the dropdown list to be toggled
    - get the dropdown list element by its id
    - toggle the visibility of the dropdown list
    */
    document.getElementById(myDropMenu).classList.toggle("invisible");
};

//-------------------------------------------------------
// CLOSE DROPDOWN MENU IF THE USER CLICKS OUTSIDE OF IT:
//-------------------------------------------------------

window.onclick = function(event) {
    /*
    Close the dropdown menu if the user clicks outside of it
    - get all dropdowns with class name "dropdownlist"
    - loop through all dropdowns and close those that are visible
    */
    if (!event.target.matches('.drop-button') && !event.target.matches('.drop-search')) {
        var dropdowns = document.getElementsByClassName("dropdownlist");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (!openDropdown.classList.contains('invisible')) {
                openDropdown.classList.add('invisible');
            }
        }
    }
};

// ----------------------
// SHOW HISTORICAL DATA:
// ----------------------

function showHistoricalData(table_id) {
    /*
    Function to show/hide historical data in the projects table
    - table_id: id of the table to be shown/hidden
    - get the table element by its id
    - get the button element by its id
    - toggle the table visibility and change the button text accordingly
    */
    var tableElement = document.getElementById('history_table_' + table_id);
    var showHistoryButton = document.getElementById('show_historical_data_button_' + table_id);
    // toggle table visibility
    // change button text accordingly:
    if (tableElement) {
        if (tableElement.style.display === 'none') {
            tableElement.setAttribute('style', 'display: table');
            showHistoryButton.innerHTML = 'Skjul Historiske Data';
        } else {
            tableElement.setAttribute('style', 'display: none');
            showHistoryButton.innerHTML = 'Vis Historiske Data';
            }
    } else {
        console.error('Element with ID history_table_' + table_id + ' not found.');
    }
};

// --------------------
// PERIODISATION DATA:
// --------------------

function getPeriodisationData(project_guid) {
    /*
    Function to get the periodisation data from the table.
    Those data will be used while submitting periodisation for the project.
    - project_guid: guid of the project
    - loop through all rows in the table and get the data from each cell
    - create a dictionary representing the row and add it to the periodisationData array
    */
    var periodisationData = [];
    var table = document.getElementById("project_workhours_period_table_" + project_guid);
    var rows = table.rows;
    var header = table.rows[0];

    // Loop through all rows in the table (except last one which is the sum row)
    for (var i = 1; i < rows.length -1; i++) {
        var row = rows[i];
        var periodisationRow = {};

        // Loop through all td elements in the row
        for (var j = 0; j < row.cells.length; j++) {
            var cell = row.cells[j];
            // Use the textContent property to get the text of the td element
            var columnName = header.cells[j].textContent.trim();
            periodisationRow[columnName] = cell.textContent.trim();
        }

        // Add the dictionary representing the row to the periodisationData array
        periodisationData.push(periodisationRow);
    }
    return periodisationData;
};

// -----------------
// LOADING SPINNER:
// -----------------

function removeLoader() {
    /*
    Function to remove the loader and reset opacity and enable click events on the page
    */
    loaderVisible = false;

    // Enable click events on the page content while loading
    $('body').css('pointer-events', '');

    // Remove opacity from page when loading is complete
    $('body').css('opacity', 1);

    // Enable scroll when loading is complete
    $('body').css('overflow', 'auto');

    // Remove the loading div element
    $("#indicator").remove();
};

function showLoader() {
    /*
    Function to show the loader and disable click events on the page content
    */
    if (!loaderVisible) {
        loaderVisible = true;

        // Append loader to the body
        $('section').append('<div style="" id="indicator"><div class="loader"></div></div>');

        // Disable click events on the page content while loading
        $('body').css('pointer-events', 'none');

        // Add opacity to page while loading
        $('body').css('opacity', 0.4);

        // Disable scroll while loading
        $('body').css('overflow', 'hidden');

        // Set a timeout for removing the loader after 60s
        setTimeout(removeLoader, 60000);
    }
};

//---------------------------------------------------
// CALCULATE REMAINING REVENUE AND DELIVERABLE VALUE:
//---------------------------------------------------

function calculateInputAlloc(pid, worktype_code, contract_value, historical_value) {
    /*
    Function to calculate the deliverable value and remaining revenue based on the input allocation amount.
    User can input the allocation amount and the deliverable value and remaining revenue will be calculated based on
    that input.
    - pid: project id
    - worktype_code: worktype code
    - contract_value: contract value of the project
    - historical_value: historical value of the project
    */
    // get elements to be updated
    var allocationAmountInputValue = parseFloat(document.getElementById("allocation_amount_" + pid + "_" + worktype_code).value);
    var deliverableValueElement = document.getElementById("deliverable_val_" + pid + "_" + worktype_code);
    var remainingRevenueElement = document.getElementById("remaining_rev_" + pid + "_" + worktype_code);
    var currentAllocationElement = document.getElementById("current_allocation_" + pid + "_" + worktype_code);
    var deliverableSpanElement = deliverableValueElement.querySelector("span");
    var remainingSpanElement = remainingRevenueElement.querySelector("span");

    if (isNaN(allocationAmountInputValue)) {
        allocationAmountInputValue = 0;
    } else if (allocationAmountInputValue > 0) {

        var deliverableValue = allocationAmountInputValue;

        // Calculate remaining revenue = Deliverable value - Historical value (fetched from VDL)
        var remainingRevenue = roundAmountNum(deliverableValue - historical_value);

        // Calculate allocation percentage:
        var allocationPercentageValue = (deliverableValue/contract_value)*100;

        // Set allocation percentage:
        currentAllocationElement.textContent = roundAndTrim(allocationPercentageValue) + " %";
    } else {
        // No allocation input provided - consider as zero
        var deliverableValue = 0, remainingRevenue = 0;
        currentAllocationElement.textContent = 0 + " %";
    };

    // update table elements with calculated values
    deliverableValueElement.firstChild.nodeValue = deliverableValue;
    deliverableValueElement.appendChild(document.createTextNode(" "));
    deliverableValueElement.appendChild(deliverableSpanElement);
    remainingRevenueElement.firstChild.nodeValue = remainingRevenue;
    remainingRevenueElement.appendChild(document.createTextNode(" "));
    remainingRevenueElement.appendChild(remainingSpanElement);
};

function calculateDefaultValuesBasedOnAlloc(pid, allocation, worktype_code, contract_value, historical_value) {
    /*
    Function to calculate the deliverable value and remaining revenue based on the allocation.
    Calculate fields based on existing value of allocated money to product fetched from BQ table
    NOTE: This will calculate also allocation percentage value and remaining revenue automatically
          based on the allocated amount of money fetched from BQ allocation table
    - pid: project id
    - allocation: allocation percentage
    */
    var allocationPercentageElement = document.getElementById("current_allocation_" + pid + "_" + worktype_code);
    var deliverableValueElement = document.getElementById("deliverable_val_" + pid + "_" + worktype_code);
    var remainingRevenueElement = document.getElementById("remaining_rev_" + pid + "_" + worktype_code);
    var allocationPercentageSpanElement = allocationPercentageElement.querySelector("span");
    var remainingSpanElement = remainingRevenueElement.querySelector("span");
    var deliverableValue = parseFloat(deliverableValueElement.textContent);

    // calculate allocation percentage based on deliverable value and contract value:
    var allocationPercentageValue = roundAndTrim((deliverableValue/contract_value)*100);

    // calculate remaining revenue = Deliverable value - Historical value (from VDL)
    var remainingRevenue = roundAmountNum(deliverableValue - historical_value);

    // update table elements with calculated values
    allocationPercentageElement.firstChild.nodeValue = allocationPercentageValue;
    allocationPercentageElement.appendChild(document.createTextNode(" "));
    allocationPercentageElement.appendChild(allocationPercentageSpanElement);
    remainingRevenueElement.firstChild.nodeValue = remainingRevenue;
    remainingRevenueElement.appendChild(document.createTextNode(" "));
    remainingRevenueElement.appendChild(remainingSpanElement);
};

//------------------------------
// CALCULATE REVENUE THIS MONTH:
//------------------------------

function CalculateInputRevenue(pid, worktype_code){
    /*
    Function to calculate the revenue this month based on the input value
    - pid: project id
    - worktype_code: worktype code
    */
    var revenueThisMonthElement = document.getElementById("revenue_tm_" + pid + "_" + worktype_code);
    var revenueThisMonthVal = parseFloat(revenueThisMonthElement.textContent);
    var revenueThisMonthInputElement = document.getElementById("revenue_tm_input_" + pid + "_" + worktype_code);
    var revenueThisMonthInputVal = parseFloat(revenueThisMonthInputElement.value);
    var revenueThisMonthSpanElement = revenueThisMonthElement.querySelector("span");

    // handle NaN input for revenue this month update:
    if (isNaN(revenueThisMonthInputVal)) {
        revenueThisMonthInputVal = 0;
    };
    // update Revenue this month as sum of existing calculated value and input value:
    revenueThisMonthNew = roundAmountNum(revenueThisMonthVal + revenueThisMonthInputVal);
    revenueThisMonthElement.firstChild.nodeValue = revenueThisMonthNew;
    revenueThisMonthElement.appendChild(document.createTextNode(" "));
    revenueThisMonthElement.appendChild(revenueThisMonthSpanElement);
};

// -------------------------
// CALCULATE SUMMARY FIELDS:
// -------------------------

function roundAndTrim(num) {
    /*
    Function to round the number to 2 decimal places and trim trailing zeros
    */
    let roundedNum = num.toFixed(2); // Round
    return parseFloat(roundedNum); // Trim
};

function roundAmountNum(num){
    /*
    Customer want to convert all prices to integer (they should be rounded to the nearest integer)
    WHY? - for some reason, it's stupid, but OK, here you are...
    */
    return parseInt(num);
};

function validatePercentageInput(input) {
    /*
    Function to validate the percentage input in the allocation input field.
    - percentage input should be between 0 and 100, and only one decimal point or comma is allowed
    - input: the input field element
    */
    // Remove any non-numeric characters except for decimal point and comma
    input.value = input.value.replace(/[^0-9.,]/g, '');

    // Ensure only one decimal point or comma exists
    var decimalSeparatorCount = (input.value.match(/[.,]/g) || []).length;
    if (decimalSeparatorCount > 1) {
        input.value = input.value.replace(/[.,]$/, ''); // Remove the last decimal separator if more than one
    }

    // Replace comma with dot for consistency
    input.value = input.value.replace(',', '.');

    // Ensure the input is a valid percentage (between 0 and 100)
    var numericValue = parseFloat(input.value);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
        input.value = ''; // Clear the input if it's not a valid percentage
    }
};

function calculateSummaryFields(guid, pid, currency) {
    /*
    Function to calculate the summary fields in the projects table.
    It will calculate the total allocation, deliverable value, remaining revenue, severa hours and revenue this month.
    - guid: guid of the project
    - pid: project id
    - currency: currency code
    */
    var table = document.getElementById("project_workhours_period_table_" + guid);
    var rows = table.rows;
    var totalAllocation = 0;
    var totalDeliverable = 0;
    var totalRemaining = 0;
    var totalSeveraHours = 0;
    var totalRevenueThisMonth = 0;
    for (var i = 1; i < rows.length - 1; i++) {
        var row = rows[i];
        var allocation = parseFloat(row.cells[2].textContent);
        var deliverable = parseFloat(row.cells[4].textContent);
        var remaining = parseFloat(row.cells[5].textContent);
        var severaHours = parseFloat(row.cells[6].textContent);
        var revenueThisMonth = parseFloat(row.cells[7].textContent);
        totalAllocation += allocation;
        totalDeliverable += deliverable;
        totalRemaining += remaining;
        totalSeveraHours += severaHours;
        totalRevenueThisMonth += revenueThisMonth;}

    // update summary fields:
    document.getElementById("sum_current_alloc_" + pid).textContent = roundAndTrim(totalAllocation) + " %";
    document.getElementById("sum_deliverable_val_" + pid).textContent = roundAmountNum(totalDeliverable) + " " + currency;
    document.getElementById("sum_remaining_rev_" + pid).textContent = roundAmountNum(totalRemaining) + " " + currency;
    document.getElementById("sum_severa_hours_" + pid).textContent = totalSeveraHours.toFixed(1);
    document.getElementById("sum_revenue_tm_" + pid).textContent = roundAmountNum(totalRevenueThisMonth) + " " + currency;
    };

// --------------------
// DISABLE BACK BUTTON:
// --------------------

function disableBack() {
    /*
    Disable the back button in the browser
    */
    history.pushState(null, null, document.URL);
    window.addEventListener('popstate', function () {
        history.pushState(null, null, document.URL);
    });
    window.onbeforeunload = function() { return "Are you sure you want to leave?"; }
};

// -----------------------
// ENABLE INDICATOR ICON:
// -----------------------

function enableIndicator(pid, type) {
    /*
    This function enables the specified indicator icon for the project
    - it will also hide the other indicators if they're visible
    - there are three types of indicators: hidden, submitted, pending
    - submitted icon - indicates that the project has been submitted with periodisation data
    - hidden icon - indicates that the project has been hidden by the user
    - pending icon - indicates that the project has not been periodised yet
    */
    var indicators = {
        hidden: document.getElementById("hidden_icon_" + pid),
        submitted: document.getElementById("submitted_icon_" + pid),
        pending: document.getElementById("pending_icon_" + pid)
    };

    // Show the specified indicator and hide others
    for (var key in indicators) {
        if (indicators[key]) {
            if (key === type) {
                indicators[key].style.visibility = "visible";
                indicators[key].classList.add("active-icon");
            } else {
                indicators[key].style.visibility = "hidden";
                indicators[key].classList.remove("active-icon");
            }
        }
    }
    // Move active icon to the first place from the left:
    moveActiveIconToFirst();
}

// --------------------------------------------------
// MOVE ACTIVE ICON TO THE FIRST PLACE FROM THE LEFT:
// --------------------------------------------------

function moveActiveIconToFirst() {
    /*
    This function moves the active icon to the first place from the left in the status container
    - active icon is the icon that indicates the current status of the project (submitted, hidden, pending)
    - submitted icon is a green checkmark - indicates that the project has been submitted with periodisation data
    - hidden icon is a red eye - indicates that the project has been hidden by the user
    - pending icon is a yellow exclamation mark - indicates that the project has not been periodised yet
    */
    const statusContainers = document.querySelectorAll('.status-container');
    statusContainers.forEach(container => {
        const activeIcon = container.querySelector('.active-icon');
        if (activeIcon) {
            container.prepend(activeIcon);
        }
    });
};

// --------------------------------
// ENABLE VIEW ALL PROJECTS BUTTON:
// --------------------------------

function enableViewAllButton(){
    /*
    This function enables the "View all projects" button
    */
    var btn = document.getElementById("view_all_projects_button");
    btn.disabled = false;
    btn.classList.remove("hidden");
};

function disableViewAllButton(){
    /*
    This function disables the "View all projects" button
    */
    var btn = document.getElementById("view_all_projects_button");
    btn.disabled = true;
    btn.classList.add("hidden");
};

function disableVIewAllIfNoHidden(){
    // disable view all projects button if no hidden projects
    var table = document.getElementById("sortable");
    var rows = table.rows;
    var hiddenProjects = false;
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].classList.contains("hidden-by-user")) {
            hiddenProjects = true;
            break;
        }
    }
    if (!hiddenProjects) {
        disableViewAllButton();
    };
};

// -----------------------------------
// SHOW/HIDE HIDDEN PROJECTS IN TABLE:
// -----------------------------------

function showHiddenProjects(hidden_pids){
    /*
    This function shows projects marked as hidden by the user in the projects table
    - hidden project contains class hidden-by-user
    - this function is called when the user clicks the "Show hidden projects" ('Vise skjult') button
    */
    var table = document.getElementById("sortable");
    var rows = table.rows;

    for (var i = 0; i < rows.length; i++) {
        if (rows[i].classList.contains("hidden-by-user")) {
            rows[i].classList.remove("hidden");
        }
    }
};

function hideHiddenProjects(){
    /*
    This function hides projects marked as hidden by the user in the projects table
    - hidden project contains class hidden-by-user
    - this function is called when the user clicks the "Hide hidden projects" ('Gjem skjult') button
    */
    var table = document.getElementById("sortable");
    var rows = table.rows;

    for (var i = 0; i < rows.length; i++) {
        if (rows[i].classList.contains("hidden-by-user")) {
            rows[i].classList.add("hidden");
        }
    }
};

function toggleShowHideProjects(){
    /*
    This function toggles the visibility of hidden projects in the projects table
    - if button text is "Vise skjult", then show projects marked as hidden by the user
    - if button text is "Gjem skjult", then hide projects marked as hidden by the user
    - button text is toggled between "Vise skjult" and "Gjem skjult" onclick
    */
    var btn = document.getElementById("view_all_projects_button");

    if (btn.innerText === "Vise skjult") {
        showHiddenProjects();
        btn.innerText = "Gjem skjult";
        // add indicator:
        var indicator = document.createElement("i");
        indicator.classList.add("fas", "fa-eye-slash");
        indicator.style.marginLeft = "10px";
        btn.appendChild(indicator);

        } else {
        hideHiddenProjects();
        btn.innerText = "Vise skjult";
        // add indicator:
        var indicator = document.createElement("i");
        indicator.classList.add("fas", "fa-eye");
        indicator.style.marginLeft = "10px";
        btn.appendChild(indicator);
        }
    };

// -------------------------------------
// MARK PROJECT AS HIDDEN BY THE USER:
// -------------------------------------

function markAsHidden(project_number, user_email) {
    /*
    This function is called when the user clicks the "Hide" button on a project row
    - the project is marked as hidden by the user in the table
    - the project is hidden from the table view by default
    - the project is excluded from the table view after next login
      (by default all hidden projects are excluded from the table view)
    - the project can be shown by the user by clicking the "Show hidden projects" ('Vise skjult') button
    - hidden project can be unhidden by the user by clicking the "Unhide" button
    */
    const table = document.getElementById("sortable");
    const t_rows = table.getElementsByTagName("tr");
    const btn = document.getElementById("view_all_projects_button");

    for (let i = 0; i < t_rows.length; i++) {
        if (t_rows[i].cells[1].innerText == project_number) {
            // Add indicator to the project that it has been hidden by user
            t_rows[i].classList.add("hidden-by-user");
            // Add indicator that project can be shown
            t_rows[i].classList.add("show-hidden-project-enabled");
            // Show hidden project indicator
            enableIndicator(project_number, "hidden");
            // Show row if the button is set to "Gjem skjult"
            if (btn.innerText === "Gjem skjult") {
                t_rows[i].classList.remove("hidden");
            } else {
                t_rows[i].classList.add("hidden");
            }

            // Create the "Unhide" button element
            const unhideButton = document.createElement('button');
            unhideButton.textContent = 'Vis';
            unhideButton.className = 'unhide-button';
            const icon = document.createElement('i');
            icon.className = 'fas fa-eye';
            unhideButton.prepend(icon);
            icon.style.paddingRight = '3px';
            unhideButton.id = 'unhide_button_' + project_number;
            unhideButton.dataset.ue = user_email;
            unhideButton.dataset.pid = project_number;


            // Append the "Unhide" button to the div with class "project-action-buttons-div"
            const actionButtonsDiv = t_rows[i].querySelector('.project-action-buttons-div');
            if (actionButtonsDiv) {
                actionButtonsDiv.appendChild(unhideButton);
            }

            // Remove the "Hide" button
            hide_btn = t_rows[i].querySelector('.hide_project');
            actionButtonsDiv.removeChild(hide_btn);

            break;
        }
    }
}


// ------------------------------------------------------------
// HIDE HIDDEN PROJECTS IN PROJECT TABLE (ON INITIAL UI LOAD):
// ------------------------------------------------------------

function markHiddenProjects(project_ids, user_email) {
    /*
    This function is called on initial UI load to hide projects that have been hidden by the user previously
    - those hidden projects (its project IDs) are stored in BQ and fetched on initial UI load
    - those projects are excluded from the table view after login
    - if user has hidden projects, then "show hidden projects" ('Vise skjult') button is enabled
    */
    table = document.getElementById("sortable");
    t_rows = table.getElementsByTagName("tr");
    // continue only if there are hidden projects:
    if (project_ids.length > 0) {
        for (i = 0; i < t_rows.length; i++) {
            if (project_ids.includes(parseInt(t_rows[i].cells[1].innerText))) {
                // get project number
                project_number = t_rows[i].cells[1].innerText;
                // add hidden class to the row
                t_rows[i].classList.add("hidden");
                // add indicator to the project that it has been hidden by user
                t_rows[i].classList.add("hidden-by-user");
                // disable hide button
                t_rows[i].querySelector(".hide_project").disabled = true;
                // add indicator that project can be shown
                t_rows[i].classList.add("show-hidden-project-enabled");

                // Create the "Unhide" button element:
                const unhideButton = document.createElement('button');
                unhideButton.textContent = 'Vis';
                unhideButton.className = 'unhide-button';
                const icon = document.createElement('i');
                icon.className = 'fas fa-eye';
                unhideButton.prepend(icon);
                icon.style.paddingRight = '3px';
                unhideButton.id = 'unhide_button_' + project_number;
                unhideButton.dataset.ue = user_email;
                unhideButton.dataset.pid = project_number;

                // Append the "Unhide" button to the div with class "project-action-buttons-div":
                const actionButtonsDiv = t_rows[i].querySelector('.project-action-buttons-div');
                if (actionButtonsDiv) {
                    actionButtonsDiv.appendChild(unhideButton);
                }

                // Remove the "Hide" button:
                hide_btn = t_rows[i].querySelector('.hide_project');
                if (hide_btn) {
                    actionButtonsDiv.removeChild(hide_btn);
                }
            }
        }
    }
};

function removeFromHidden(project_number, user_email) {
    /*
    This function is called when the user clicks the "Unhide" button on a hidden project row
    - the project is removed from the hidden projects list
    - the project is shown in the table view
    - the project is marked as pending (yellow exclamation mark)
    - the project can be hidden again by the user by clicking the "Hide" button
    */
    const table = document.getElementById("sortable");
    const t_rows = table.getElementsByTagName("tr");

    for (let i = 0; i < t_rows.length; i++) {
        if (t_rows[i].cells[1].innerText == project_number) {
            // Remove the hidden-by-user class
            t_rows[i].classList.remove("hidden-by-user");
            // Remove the show-hidden-project-enabled class
            t_rows[i].classList.remove("show-hidden-project-enabled");
            // Remove the hidden class
            t_rows[i].classList.remove("hidden");
            // Enable pending indicator
            enableIndicator(project_number, "pending");

            // Remove the unhide button
            const unhideButton = t_rows[i].querySelector('.unhide-button');
            if (unhideButton) {
                t_rows[i].querySelector('.project-action-buttons-div').removeChild(unhideButton);
            }

            // Create the "Hide" button element
            const hideButton = document.createElement('button');
            hideButton.textContent = 'Skjul';
            hideButton.className = 'hide_project';
            // add showHideModal() onclick action to the hide button:
            hideButton.setAttribute('onclick', 'showHideModal(' + project_number + ')');

            const icon = document.createElement('i');
            icon.className = 'fas fa-eye-slash';
            hideButton.prepend(icon);
            icon.style.paddingRight = '3px';
            hideButton.id = 'hide_project_button_' + project_number;
            hideButton.dataset.pid = project_number;
            hideButton.dataset.ue = user_email;

            // Append the "Hide" button to the div with class "project-action-buttons-div"
            const actionButtonsDiv = t_rows[i].querySelector('.project-action-buttons-div');
            if (actionButtonsDiv) {
                actionButtonsDiv.appendChild(hideButton);
            }

            break;
        }
    }
};
