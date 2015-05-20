
var MachGrid = (function(){

	var _useStandardMatchs = HTMLElement.prototype.matches != null;
	var blank = {};

	function addDelegate(htmlElement, selector, event, handler){
		htmlElement.addEventListener(event, function(e){
			if(e.target){
				var finger = e.target;
				var shouldHandle;

				while(finger != htmlElement){
					if(_useStandardMatchs){
						shouldHandle = finger.matches(selector, htmlElement);
					}else{
						shouldHandle = finger.msMatchesSelector(selector, htmlElement);
					}
					if(shouldHandle){
						handler.call(finger, e);
						return;
					}

					finger = finger.parentElement;
				}
			}
		}, true);
	}

	function addEventHandlerSet(htmlElement, handlerMap){
		Object.keys(handlerMap).forEach(function(key){
			htmlElement.addEventListener(key, handlerMap[key]);
		});
	}


	function getComputedStyle(htmlElement){
		if(htmlElement.currentStyle){
			return htmlElement.currentStyle;
		}else{
			return document.defaultView.getComputedStyle(htmlElement);
		}
	}

	function MachGrid(wrapper, options){
		if(options == null){
			options = {
				getCellRenderer : function(colIndex){
					return null;
				}
			};
		}

		this.wrapper = wrapper;
		this.options = options;
		this.table = wrapper.querySelector("table:first-child");
		this._selectedIndex = -1;
		this._firstRowIndex = 0;

		var s = getComputedStyle(wrapper);
		this.init();
	}

	function toArray(arrLike){
		return Array.prototype.slice.call(arrLike, 0);
	}

	Object.defineProperties(MachGrid.prototype, {
		'protoRow' : {
			get : function(){
				if(this._protoRow){
					return this._protoRow;
				}

				this._protoRow = this.table.querySelector("tbody tr:first-child");
				return this._protoRow;
			}
		},

		'firstRowIndex' : {
			get : function(){
				return this._firstRowIndex;
			},

			set : function(newIndex){
				if(this._firstRowIndex == newIndex){
					return;
				}

				this._firstRowIndex = newIndex;

				this.refresh();
				return newIndex;
			}
		},

		'tableBody' : {
			get : function(){
				return this.table.querySelector("tbody");
			}
		},

		'selectedIndex' : {
			get : function(){
				return this._selectedIndex;
			},

			set : function(newIndex){
				if(this._selectedIndex == newIndex){
					return;
				}

				this._selectedIndex = newIndex;
				this.refresh();
				return newIndex;
			}
		},

		'dataSource' : {
			get : function(){
				return this._dataSource;
			},

			set : function(newSource){
				if(this._dataSource == newSource){
					return;
				}

				this._dataSource = newSource;
				this._selectedIndex = -1;
				this._firstRowIndex = 0;
				this._updateScrollBars();
				this.refresh();

				return newSource;
			}
		},

		'visibleRowCount' : {
			get : function(){
				return this.tableBody.querySelectorAll("tr").length;
			}
		}
	});

	MachGrid.prototype.init = function(){
		this.wrapper.style.boxSizing = "border-box";
		this.wrapper.style.position = "relative";
		this.table.style.boxSizing = "border-box";
		this.table.style.width = "100%";
		this.table.style.borderSpacing = "0px";

		var availableHeight = this.wrapper.clientHeight - this.table.offsetHeight;
		var numItemToCreate = Math.floor(availableHeight / this.protoRow.offsetHeight);
		var i, tr;

		for(i = 0; i<numItemToCreate; i++){
			tr = document.createElement("tr");
			tr.innerHTML = this.protoRow.innerHTML;
			this.tableBody.appendChild(tr);
		}

		this._initScrollBars();


		this._initEventHandlers();
		this.refresh();
	};

	MachGrid.prototype._initScrollBars = function(){
		var scrollBar = document.createElement("div");
		scrollBar.classList.add("mach-grid-scrollbar");
		scrollBar.style.position = "absolute";
		scrollBar.style.right = "0px";
		scrollBar.style.bottom = "0px";
		scrollBar.style.top = this.table.querySelector("thead").offsetHeight;
		scrollBar.style.width = "12px";
		scrollBar.style.opacity = 0;
		scrollBar.style.transition = "opacity ease-in-out 0.3s";
		this.wrapper.appendChild(scrollBar);
		this.verticalScrollBar = scrollBar;

		var thumb = document.createElement("div");
		thumb.classList.add("mach-grid-scrollbar-thumb");
		thumb.style.position = "absolute";
		thumb.style.left = "0px";
		thumb.style.right = "1px";
		thumb.style.top = "0px";
		thumb.style.height = "30px";
		thumb.style.backgroundColor = "#444";
		thumb.style.borderRadius = "10px";
		thumb.style.opacity = 0.8;
		thumb.style.cursor = "pointer";
		this.thumb = thumb;


		scrollBar.appendChild(thumb);

		var origin = {};

		var onmousemove = (function(e){
			var delta = e.screenY - origin.offset;
			var top = origin.top + delta;

			var topRange = this.tableBody.offsetHeight - thumb.offsetHeight;
			top = Math.min(Math.max(top, 0), topRange);
			thumb.style.top = top;

			var ratio = top / topRange;
			var index = Math.round((this._getNumberOfRows() - this.visibleRowCount) * ratio);
			this.firstRowIndex = index;

			this.showScrollBar();
			e.preventDefault();
		}).bind(this);

		var onmouseup = (function(e){
			delete origin.offset;
			this.showScrollBar();
			window.removeEventListener('mousemove', onmousemove);
			window.removeEventListener('mouseup', onmouseup);
		}).bind(this);

		var me = this;
		addEventHandlerSet(thumb, {
			'mousedown' : function(e){
				origin = {
					offset : e.screenY,
					top : this.offsetTop
				};

				e.preventDefault();

				window.addEventListener('mousemove', onmousemove);
				window.addEventListener('mouseup', onmouseup);
			}
		});
	};

	MachGrid.prototype._updateScrollBars = function(){
		if((this._getNumberOfRows() - this.visibleRowCount) <= 0){
			return;
		}

		var ratio = this.firstRowIndex / (this._getNumberOfRows() - this.visibleRowCount);
		var topRange = this.tableBody.offsetHeight - this.thumb.offsetHeight;
		this.thumb.style.top = topRange * ratio;
		this.showScrollBar();
	};

	MachGrid.prototype._initEventHandlers = function(){
		var me = this;

		this.table.addEventListener("wheel", (function(e){
			var delta = e.wheelDeltaY || e.deltaY * -1;

			var amount = Math.floor(delta / this.protoRow.offsetHeight) * -1;
			this.firstRowIndex = Math.min(Math.max(this.firstRowIndex + amount, 0), Math.max(this._getNumberOfRows() - this.visibleRowCount, 0));

			e.preventDefault();


		}).bind(this));

		addDelegate(this.table, "tr", "click", function(e){
			var index = parseInt(this.getAttribute("data-row-index"));
			if(index < me._getNumberOfRows()){
				me.selectedIndex = index;
			}
		});
	};

	MachGrid.prototype.refresh = function(){
		if(this._refreshTimeout){
			return;
		}
		this._refreshTimeout = setTimeout(this._refresh.bind(this));
	};

	MachGrid.prototype._refresh = function(){
		this._updateScrollBars();

		var rows = toArray(this.tableBody.querySelectorAll("tr"));
		var me = this;
		rows.forEach(function(eachRow, rowIndex){
			var modelRowIndex = rowIndex + me.firstRowIndex;
			eachRow.setAttribute("data-row-index", modelRowIndex);

			if(me.selectedIndex >=0 && modelRowIndex == me.selectedIndex){
				eachRow.classList.add("selected");
			}else{
				eachRow.classList.remove("selected");
			}

			var cells = toArray(eachRow.querySelectorAll("td"));
			cells.forEach(function(eachCell, colIndex){
				var data = me._getData(modelRowIndex, colIndex);
				if(data == blank){
					eachCell.innerHTML = "&nbsp;";
				} else {
					var renderer = me.options.getCellRenderer(colIndex);
					if(renderer){
						renderer(eachCell, data, modelRowIndex);
					}
					else{
						eachCell.innerText = data;
					}

				}

			});
		});
		me = null;
		delete this._refreshTimeout;
	};

	MachGrid.prototype.showScrollBar = function(){
		this.verticalScrollBar.style.opacity = 1;

		clearTimeout(this._hidingScrollBarTimeout);
		this._hidingScrollBarTimeout = setTimeout((function(){
			this.verticalScrollBar.style.opacity = 0;
		}).bind(this), 2000);
	}

	MachGrid.prototype._getNumberOfRows = function(){
		if(this._dataSource instanceof Array){
			return this._dataSource.length;
		}

		else if(this._dataSource && this._dataSource.getNumberOfRows){
			return this._dataSource.getNumberOfRows();
		}

		else {
			return 0;
		}
	},

	MachGrid.prototype._getData = function(row, col){
		if(this._dataSource instanceof Array && this._dataSource[row] && this._dataSource[row][col] != null){
			return this._dataSource[row][col];
		}

		else if(this._dataSource && this._dataSource.getData){
			return this._dataSource.getData(row, col);
		}

		else {
			return blank;
		}
	};


	return MachGrid;
})();
