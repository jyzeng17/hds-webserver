(function() {
	"use strict";

	const QUERIES = [
		{parentName: "", name: "from"},
		{parentName: "from", name: "keep"},
		{parentName: "", name: "to"},
		{parentName: "to", name: "name"},
		{parentName: "to", name: "location"},
		{parentName: "to", name: "time"}
	];

	let selectedProtocolFrom = "";
	let selectedProtocolTo = "";
	let nextSelectPickerFromID = 0;
	let nextSelectPickerToID = 0;

	function updateSelectPickerID() {
		// from
		nextSelectPickerFromID = 0;
		while ($("#selectpicker-from-" + nextSelectPickerFromID).length) {
			++nextSelectPickerFromID;
		}
		// to
		nextSelectPickerToID = 0;
		while ($("#selectpicker-to-" + nextSelectPickerToID).length) {
			++nextSelectPickerToID;
		}
	}

	function refreshSelectPickerGroup(query, lastSelectPickerID) {
		let nextSelectPickerID = (query === "from")
			? nextSelectPickerFromID
			: nextSelectPickerToID;

		// 刪除所有在 selectPickerID 後的 selectpicker, 並更新 selectPickerID 值
		for (let i = Number(lastSelectPickerID) + 1; i < nextSelectPickerID; ++i) {
			// First destroy the selectpicker wrapper, then remove the whole element
			$("#selectpicker-" + query + "-" + i).selectpicker("destroy").remove();
			//console.log(i + " removed");
		}
		if (query === "from") {
			nextSelectPickerFromID = Number(lastSelectPickerID) + 1;
		} else {
			nextSelectPickerToID = Number(lastSelectPickerID) + 1;
		}

		let protocol = "";
		let serverName = "";
		let serverPort = "";

		let urlQuery = "";

		if (query === "from") {
			if (selectedProtocolFrom === "")
				return;

			protocol = selectedProtocolFrom + "://";
		} else {
			if (selectedProtocolTo === "")
				return;

			protocol = selectedProtocolTo + "://";
		}

		// Test
		if (serverPort !== "") {
			serverPort = ":" + serverPort;
		}

		let fromPath = "/";
		for (let i = 0; i <= lastSelectPickerID; ++i) {
			// None selected option is impossible
			let option = $("#selectpicker-" + query + "-" + i).find(":selected").text();

			//console.log("selected option: " + option);

			if (fromPath.slice(-1) !== "/") {
				fromPath += "/";
			}

			fromPath += option;
		}

		fromPath += "?directory=" + encodeURIComponent("true");

		// 需要一個 from query 能夠列出所有前面已選路徑底下的全部檔案和目錄
		urlQuery = "?from=" + encodeURIComponent(protocol + serverName + serverPort + fromPath);

		// Test
		let hostName = "slave01";
		let hostPort = "8000";
		let api = "list";
		let urlPath = "http://" + hostName + ":" + hostPort + "/dataservice/v1/" + api;
		let url = urlPath + urlQuery;

		//console.log("refresh select picker group url = " + url);

		$.get(url, function(data) {
			nextSelectPickerID = (query === "from")
				? nextSelectPickerFromID
				: nextSelectPickerToID;

			let newSelectPicker = createSelectPicker(data.dataInfo, query, nextSelectPickerID);

			if (newSelectPicker === "")
				return;

			$("#" + query + "-select-picker").append(newSelectPicker);
			
			$("#selectpicker-" + query + "-" + nextSelectPickerID).selectpicker("render");

			// Selectpicker on changed callback
			$("#selectpicker-" + query + "-" + nextSelectPickerID).on("changed.bs.select", function() {
				let thisQuery = $(this).attr("selectpicker-query");
				let thisID = $(this).attr("selectpicker-id");

				//console.log("onChanged, query=" + query + ", id=" + id);

				if (((typeof thisQuery) !== "undefined") && ((typeof thisID) !== "undefined")) {
					refreshSelectPickerGroup(thisQuery, thisID);
				}
			});

			if (query === "from") {
				nextSelectPickerFromID = Number(nextSelectPickerFromID) + 1;
			} else {
				nextSelectPickerToID = Number(nextSelectPickerToID) + 1;
			}
			//console.log("nextSelectPickerFromID = " + nextSelectPickerFromID);
			//console.log("done");
		}).error(function(jqxhr, text, err) {
			// text = textStatus = "error"
			// err = errorThrown = "Internal Server Error"
			// jqxhr = jqXHR = Object

			//let msg = "<p><b>Error!</b><ul>";
			//if (jqxhr.status == 500) {
			//	// Show user the received error message
			//	let response = JSON.parse(jqxhr.responseText);
			//	msg += "<li><b>url:</b> " + url + "</li>";
			//	msg += "<li><b>exception:</b> " + response.RemoteException.RemoteException.exception + "</li>";
			//	msg += "<li><b>message:</b> " + response.RemoteException.RemoteException.message + "</li>";
			//} else {
			//	// Show user the default error message
			//	msg += "<li><b>url:</b> " + url + "</li>";
			//	msg += "<li><b>errorThrown:</b> " + err + "</li>";
			//}
			//msg += "</ul></p>";

			// 隱藏 select picker group 並顯示直接填值的 text input 給使用者輸入
			console.log(err);
		});
	}

	function renderQueryFormGroups() {
		//createQueryFormGroup(parentName, name, isHidden, isRequired, isProtocolButtonGroup)
		var content = ''
			+ createQueryFormGroup("", "from", false, true, true)
			//+ createQueryFormGroup("", "from", false, true, false)
			+ createSelectPickerFormGroup("from")
			+ createCollapseButton("from")
			+ '<div id="from-queries" hidden>'
			+ createQueryFormGroup("from", "keep", false, false, false, "true/false")
			+ '</div>'
			+ createQueryFormGroup("", "to", false, true, true)
			//+ createQueryFormGroup("", "to", false, true, false)
			+ createSelectPickerFormGroup("to")
			+ createCollapseButton("to")
			+ '<div id="to-queries" hidden>'
			+ createQueryFormGroup("to", "name", true, false, false)
			+ createQueryFormGroup("to", "location", true, false, false, "hdfs/hbase")
			+ createQueryFormGroup("to", "time", false, false, false, "yyyy-MM-dd'T'HH:mm:ss.SSS")
			+ '</div>';

		$("#query-form-groups").html(content);

		$(".protocol-btn").on("click", function() {
			let query = $(this).attr("query");
			let thisProtocol = $(this).attr("protocol");

			// Change color
			$(this).attr("style", "color: #ffffff; background: #428bca");
			PROTOCOLS.forEach(function (protocol) {
				if (protocol !== thisProtocol) {
					$("#button-" + query + "-" + protocol).removeAttr("style");
				}
			});

			// Toggle hidden query form groups
			if (query === "to") {
				if (thisProtocol === "hds") {
					$("#" + query+ "-name-form-group").show();
					$("#" + query+ "-location-form-group").show();
				} else {
					$("#" + query+ "-name-form-group").hide();
					$("#" + query+ "-location-form-group").hide();
				}
			}

			if (query === "from") {
				selectedProtocolFrom = thisProtocol;
			} else {
				selectedProtocolTo = thisProtocol;
			}

			refreshSelectPickerGroup(query, -1);
		});
	}

	function renderStaticContents() {
		renderQueryFormGroups();
	}

	//function getUrlWithInodePath(inodePath) {
	//	return "http://slave01:8000/dataservice/v1/list" + getQuery(inodePath);
	//}

	function getQueryValue(query) {
		let protocol = "";

		if (query === "from") {
			if (selectedProtocolFrom === "")
				return "";

			protocol = selectedProtocolFrom + "://";
		} else {
			if (selectedProtocolTo === "")
				return "";

			protocol = selectedProtocolTo + "://";
		}

		let host = "";
		let port = "";
		let path = "/";

		if (port !== "") {
			port = ":" + port;
		}

		let nextSelectPickerID = (query === "from")
			? nextSelectPickerFromID
			: nextSelectPickerToID;

		for (let i = 0; i < nextSelectPickerID; ++i) {
			// None selected option is impossible
			let option = $("#selectpicker-" + query + "-" + i).find(":selected").text();

			if (path.slice(-1) !== "/") {
				path += "/";
			}

			path += option;
		}

		path += $("#text-" + query).val();

		return protocol + host + port + path;
	}

	function getQuery(inodePath = "") {
		var query = "";
		var isFirstQuery = true, isInSubQuery = false;

		QUERIES.forEach(function (element) {
			let isSubQuery = (element.parentName !== "");
			let idName = ((!isSubQuery)? '' : element.parentName + '-')
				+ element.name;

			if ($("#checkbox-" + idName).is(":checked")) {
				let newQuery = "";

				// Assign prefix symbol
				if (isFirstQuery && !isInSubQuery) {
					newQuery += "?";
					isFirstQuery = false;
				} else if (!isFirstQuery && !isInSubQuery) {
					if (isSubQuery) {
						isInSubQuery = true;
						newQuery += "?";
					} else {
						newQuery += "&";
					}
				} else if (!isFirstQuery && isInSubQuery) {
					if (!isSubQuery) {
						isInSubQuery = false;
					}
					newQuery += "&";
				}

				// Assign query value
				let encodedQueryValue = "";
				if (element.name === "from") {
					encodedQueryValue += encodeURIComponent(getQueryValue("from"));
				} else if (element.name === "to") {
					encodedQueryValue += encodeURIComponent(getQueryValue("to"));
				} else {
					let textValue = $("#text-" + idName).val();
					encodedQueryValue += encodeURIComponent(textValue);
				}

				newQuery += element.name + "=" + encodedQueryValue;

		//let text = $("#selectpicker-from-0").find(":selected").text();

				query += (!isSubQuery)? newQuery : encodeURIComponent(newQuery);
			}

		});

		return query;
	}

	function refreshResponseTable(url) {
		$("#alert-panel").hide();

		if (url == "button.send") {
			//url = "http://" + window.location.host + "/dataservice/v1/access?" + getQuery();
			url = "http://slave01:8000/dataservice/v1/access" + getQuery();
			//url = "http://" + $("#text-host").val() + ":" + $("#number-port").val() + "/dataservice/v1/access?" + getQuery();
			console.log("button send url = " + url);
		}

		window.location.hash = url;

		$.get(url, function(data) {

			// render template: dust.render(templateName, data, callback);
			dust.render('response', data, function(err, out) {
				$('#result-table').html(out);
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

		//var url = window.location.hash.slice(1);
		//refreshResponseTable(url);
		updateSelectPickerID();
		refreshSelectPickerGroup("from", nextSelectPickerFromID - 1);
	}

	// Re-send requests once url changes
	//$(window).bind('hashchange', function () {
	//	var url = decodeURIComponent(window.location.hash.slice(1));
	//	refreshResponseTable(url);
	//});

	$("#button-send").click(function () {
		refreshResponseTable("button.send");
	});

	initialize();
})();
