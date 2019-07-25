(function() {
	"use strict";

	const QUERIES = [
	];

	function renderQueryFormGroups() {
		//createQueryFormGroup(parentName, name, isHidden, isRequired, isProtocolButtonGroup)
		var content = '';

		$("#query-form-groups").html(content);
	}

	function renderStaticContents() {
		renderQueryFormGroups();
	}

	//function getUrlWithInodePath(inodePath) {
	//	return "http://slave01:8000/dataservice/v1/list" + getQuery(inodePath);
	//}

	var loadingReturn;

	function format (d) {
		var host = d[0];
		var operation;
		var returned = '';

		for (let i = 0; i < loadingReturn.length; ++i) {
			if (loadingReturn[i]['host'] === host) {
				operation = loadingReturn[i]['operation'];
				break;
			}
		}

		// Panel
		returned += '<div class="panel panel-default">'
			+ '<div class="panel-heading">'
			+ '<h3 class="panel-title">operations</h3>'
			+ '</div>'
			+ '<div id="result-table" style="padding:10px"></div>'

		returned += '<table class="table">'
			+ '<thead>'
			+ '<tr>'
			+ '<th>method</th>'
			+ '<th>dealtCount</th>'
			+ '<th>dealtBytes</th>'
			+ '<th>pastCount</th>'
			+ '<th>pastBytes</th>'
			+ '</tr>'
			+ '</thead>'
			+ '<tbody>';

		for (let i = 0; i < operation.length; ++i) {
			returned += '<tr>'
				+ '<td>' + operation[i]['method'] + '</td>'
				+ '<td>' + operation[i]['dealCount'] + '</td>'
				+ '<td>' + operation[i]['dealBytes'] + '</td>'
				+ '<td>' + operation[i]['pastCount'] + '</td>'
				+ '<td>' + operation[i]['pastBytes'] + '</td>'
				+ '</tr>';
		}

		returned += '</tbody>'
			+ '</table>'
			// Panel
			+ '</div>';

		return returned;
	}

	function refreshResponseTable(url) {
		$("#alert-panel").hide();

			//url = "http://" + window.location.host + "/dataservice/v1/access?" + getQuery();
			url = "http://slave01:8000/dataservice/v1/loading";
			//url = "http://" + $("#text-host").val() + ":" + $("#number-port").val() + "/dataservice/v1/access?" + getQuery();

		window.location.hash = url;

		$.get(url, function(data) {
			// render template: dust.render(templateName, data, callback);
			dust.render('response', data, function(err, out) {

				loadingReturn = data.loading;

				$('#result-table').html(out);

				var table = $('#table-response').DataTable( {
					'lengthMenu': [ [25, 50, 100, -1], [25, 50, 100, "All"] ],
					'columns': [
						null, // host
						null, // port
						{
							"className": 'operations-control',
							"orderable": false
						}
					],
					"deferRender": true,
				});

				//// Add event listener for opening and closing details
				$('#table-response tbody').on('click', 'td.operations-control', function () {
					var span = $(this).find("span");
					span.toggleClass('glyphicon-chevron-down');
					span.toggleClass('glyphicon-chevron-up');

					var tr = $(this).closest('tr');
					var row = table.row( tr );

					if ( row.child.isShown() ) {
						// This row is already open - close it
						row.child.hide();
						tr.removeClass('shown');
					}
					else {
						// Open this row
						row.child( format(row.data()) ).show();
						tr.addClass('shown');
					}
				});
			});
		}).error(function(jqxhr, text, err) {
			// text = textStatus = "error"
			// err = errorThrown = "Internal Server Error"
			// jqxhr = jqXHR = Object
			let msg = "<p><b>Error!</b><ul>";
			if (jqxhr.status == 500) {
				// Show user the received error message
				let response = JSON.parse(jqxhr.responseText);
				msg += "<li><b>url:</b> " + url + "</li>";
				msg += "<li><b>exception:</b> " + response.RemoteException.RemoteException.exception + "</li>";
				msg += "<li><b>message:</b> " + response.RemoteException.RemoteException.message + "</li>";
			} else {
				// Show user the default error message
				msg += "<li><b>url:</b> " + url + "</li>";
				msg += "<li><b>errorThrown:</b> " + err + "</li>";
			}
			msg += "</ul></p>";
			$('#alert-panel-body').html(msg);
			$('#alert-panel').show();
		});
	}

	//function refillInputFieldsByURL(url) {

	function initialize() {
		renderStaticContents();

		// compile and register Dust.js
		dust.loadSource(dust.compile($('#tmpl-response').html(), 'response'));

		var url = window.location.hash.slice(1);
		refreshResponseTable(url);
	}

	//$(window).bind('hashchange', function () {
	//	var url = decodeURIComponent(window.location.hash.slice(1));
	//	refreshResponseTable(url);
	//});

	$("#button-send").click(function () {
		refreshResponseTable("button.send");
	});

	initialize();
})();
