

//patching Alpaca to force clearing form elem before creating a new one
(function($){
	var orig = $.fn.alpaca;
	$.fn.alpaca = function instrumented(){
		$.fn.empty.apply(this);
		return $.fn.alpaca._instrumented.apply(this, arguments);
	}
	$.fn.alpaca._instrumented = orig;
})(jQuery);

function FormModel(){
		this.order = [];
		this.form = {"schema": {
					  "title":"WebTT",
					  "description": "Preview",
					  "type":"object",
					  "properties": {  }
					},
					"options" : {
						"fields" : {
						}
					  }
				};
				
		this.props = this.form["schema"]["properties"];
		this.fields = this.form["options"]["fields"];
		
		this.getElemIndex = function(name){
			for (var i=0; i<this.order.length;i++){
				if (this.order[i].name == name){
					return i;
				}
			}
			return -1;
		
		};
		
		this.remove = function(name){
			this.order.splice(this.getElemIndex(name),1);
			this.updateFormOrder();
		};

        this.getElemByName = function(name){
            console.log("Edit:" + this.getElemIndex(name));
            return this.order[this.getElemIndex(name)];
        };
		
		this.add = function(obj, type){
			var nome = obj["titolo"];
			nome = $.trim(nome).replace(/\s+/g, '');
			switch (type){
				case "date":
					this.props[nome] =  {
							  "type":"string",
							  "title":obj["titolo"],
							  "format" : "date"
							}
					this.fields[nome] = {
						"hideInitValidationError" : true
					}
				break;
				case "number":
					this.props[nome] =  {
							  "type":"number",
							  "title":obj["titolo"]
							}
					this.fields[nome] = {}		
				break;
				case "textarea":
					this.props[nome] =  {
							  "type":"string",
							  "title":obj["titolo"]
							}
							
					this.fields[nome] = {
								"type": "textarea",
								"rows": 5,
								"cols": 40
							}
					
				break;
				case "radio":
					var e = [];
					if(obj["item_1"]!='') e.push(obj["item_1"]);
					if(obj["item_2"]!='') e.push(obj["item_2"]);
					if(obj["item_3"]!='') e.push(obj["item_3"]);
					if(obj["item_4"]!='') e.push(obj["item_4"]);
					
					this.props[nome] =  {
						"type":"string",
						"enum":e
					}
					this.fields[nome] = {
						"type": "select",
						"optionLabels": e
					}
					
				break;
			}
			
			var index = this.getElemIndex(nome);
			if(index == -1) this.order.push({"name":nome, "props" : [this.props[nome], this.fields[nome]]});
			else this.order[index] = {"name":nome, "props" : [this.props[nome], this.fields[nome]]};
			this.updateFormOrder();
		};

        this.edit = function(obj,nome){
            alert(this);
            console.log(this);
            console.log(obj);
        
            var e = [];
            for (var i=1; i<65; i++)
                if(obj["item_"+i]!='') e.push(obj["item_"+i]);
            
            
            this.props[nome] =  {
                "type":"string",
                "title":obj["titolo"],
                "enum":e
            }
            this.fields[nome] = {
                "type": "select",
                "optionLabels": e
            }
			var index = this.getElemIndex(nome);
			if(index == -1) this.order.push({"name":nome, "props" : [this.props[nome], this.fields[nome]]});
			else this.order[index] = {"name":nome, "props" : [this.props[nome], this.fields[nome]]};
			this.updateFormOrder();
        }
		this.moveUp = function(name){
			var index = this.getElemIndex(name);
			if(index <= 0 ) return;
			var tmp = this.order[index-1];
			this.order[index-1] = this.order[index];
			this.order[index] = tmp;
			this.updateFormOrder();
		};
		
		this.moveDown = function(name){
			var index = this.getElemIndex(name);
			if(index == this.order.length -1 || index == -1) return;
			var tmp = this.order[index+1];
			this.order[index+1] = this.order[index];
			this.order[index] = tmp;
			this.updateFormOrder();
		};
		
		this.updateFormOrder = function(){
			this.form["schema"]["properties"] = {};
			this.form["options"]["fields"] = {};

			for (var i = 0; i < this.order.length; i++){
				this.form["schema"]["properties"][this.order[i].name] = this.order[i].props[0];
				this.form["options"]["fields"][this.order[i].name] = this.order[i].props[1];
			}
			this.props = this.form["schema"]["properties"];
			this.fields = this.form["options"]["fields"];
		};

		this.setInitialOrder = function(){
		       for (var prop in this.form["schema"]["properties"]){
		       		this.order.push({"name" : prop, "props" : [ this.form["schema"]["properties"][prop], this.form["options"]["fields"][prop]]});
		       }
		       this.props = this.form["schema"]["properties"];
		       this.fields = this.form["options"]["fields"];
		
		}
}

$(document).ready(function(){
	
	$("#controlsDialog").dialog({ autoOpen: false, width:'auto' });
		
	$("#export").on('click', function(){
		$("#json").empty().text(JSON.stringify(preview.form));
		console.log(JSON.stringify(preview.form));
	});	
		
	$(document).on('submit', "#web-tt-form", function(){
			$("#WebTt_template").val(JSON.stringify(preview.form));
			return true;
	});
	
	$(document).on("click", ".addControl", function(){
		addControls($(this).attr('id'));
	})
	
	preview = new FormModel();
	try{
		preview.form  = JSON.parse($("#WebTt_template").val());
		preview.setInitialOrder();
	}catch(e){
		preview.form = {"schema": 
				{
					"title":"WebTT",
					"description": "Preview",
					"type":"object",
					"properties": {  }
				},
				"options" : {
					"fields" : {
						}
				}
				};
		

	}
	preview.form['postRender'] = myPostRender;
	$("#form_preview").alpaca(preview.form);
});


function myPostRender(form){
	myPostRender.count = 0;
	myPostRender.lastOffset = 0;
    $( ".alpaca-fieldset-items-container" ).sortable({
		axis: 'y',
		start: function(event, ui) {
			
		},
		change: function( event, ui ) {
			if(ui.originalPosition.top - ui.position.top > myPostRender.lastOffset)
				myPostRender.count++;
			else myPostRender.count--;
			myPostRender.lastOffset = ui.originalPosition.top - ui.position.top;
		},
		stop: function(event, ui) {
			var target ="#" + ui.item.attr('alpaca-id');
			var name = $(target).attr('name');
			console.log(myPostRender.count);
			if(myPostRender.count > 0) for(var i = 0; i < myPostRender.count; i++)preview.moveUp(name);
			if(myPostRender.count < 0) for(var i = 0; i > myPostRender.count; i--)preview.moveDown(name);
			myPostRender.count = 0;
			myPostRender.lastOffset = 0;
		},
		revert: true
    });

	$("#form_preview .alpaca-fieldset-item-container[alpaca-id]").each(function(){
	
			var target ="#" + $(this).attr('alpaca-id');
			var name = $(target).attr('name');
			
			var tprev = "#" + $(this).prev().attr('alpaca-id');
			var prev = $(tprev).attr('name');
			
			var tnext = "#" + $(this).next().attr('alpaca-id');
			var next = $(tnext).attr('name');
			
			var cmd$ = $('<div class="cmd" />');
			cmd$.append('<div class="cancel"><img src="img/del.png" height="24" width=24"></div>');
			cmd$.append('<div class="up"><img src="img/up.png" height="24" width=24"></div>');
			cmd$.append('<div class="down"><img src="img/arrow.png" height="24" width=24"></div>');

			var elementType = $(target).get(0).tagName;
            if(elementType=='SELECT' )
                cmd$.append('<div class="edit"><img src="img/edit.png" height="24" width=24"></div>');

			$(this).append(cmd$);
			if(prev != undefined && prev != ''){
				$(this).on('click', '.up', function(){
					preview.moveUp(name);
					$("#form_preview").alpaca(preview.form);
				});
			}
			
			if(next != undefined && next != ''){
				$(this).on('click', '.down', function(){
					preview.moveDown(name);
					$("#form_preview").alpaca(preview.form);
				});
			}
			
			$(this).on('click', '.cancel', function(){
				console.log("Nome: " + name);
				preview.remove(name);
				$("#form_preview").alpaca(preview.form);
			});

            $(this).on('click', '.edit', function(){
                console.log("Editing: " + name);
                editControl(name);
            })
		}); 
}

function editControl(name){
    var elem=preview.getElemByName(name);
    var elem_enum=elem['props'][0]['enum'];
    console.log(elem['props'][0]['enum']);

    description = "Aggiungi un campo di tipo combobox";
    var form = {	
        "schema": {
            "description": description,
            "type":"object",
            "properties": {
                "titolo": {
                    "type":"string",
                    "title":"Titolo",
                    "default":name
                },
            }
        } 
    }
    for(var i=1; i<65; i++){
        if(elem_enum[i-1]!="" && (i-1)<elem_enum.length){
            form["schema"]["properties"]["item_"+i]= {
                "type":"string",
                "title":"item_"+i,
                "default":elem_enum[i]
            }
        }
        else{
            form["schema"]["properties"]["item_"+i] = {
                "type":"string",
                "title":"item_"+i,
                "default":""
            }
        }
    }
    
    console.log(form);
	form["postRender"] = function(renderedForm) {
					  $('#form1-button').click(function() {
						if (renderedForm.isValid(true)) {
						  var val = renderedForm.getValue();
						  preview.edit(val,name);
						  $("#form_preview").alpaca(preview.form);
						  $("#controlsDialog").dialog("close");
						}
					  });
				  }
	$("#form1").alpaca(form);
	$("#controlsDialog").dialog("open");
	return false;
}
function addControls(type){

	$("#form1-button").off();	
	var label, title, description;
	
	var form = {	
					"schema": {
					  "description": description,
					  "type":"object",
					  "properties": {
						"titolo": {
						  "type":"string",
						  "title":"Titolo"
						}//,
						//"nome": {
						//  "type":"string",
						//  "title":"Nome"
						//}
					  }
					}
				}
	
	switch (type){
		case "date":
			description = "Aggiungi un campo di tipo data";
		break;
		case "number":
			description = "Aggiungi un campo di tipo numerico";
		break;
		case "textarea":
			description = "Aggiungi un campo di tipo testo";
		break;
		case "radio":
			description = "Aggiungi un campo di tipo combobox";
			var form = {	
				"schema": {
				  "description": description,
				  "type":"object",
				  "properties": {
					"titolo": {
					  "type":"string",
					  "title":"Titolo"
					},
					"item_1": {
					  "type":"string",
					  "title":"item_1"
					},
					"item_2": {
					  "type":"string",
					  "title":"item_2"
					},
					"item_3": {
					  "type":"string",
					  "title":"item_3"
					},
					"item_4": {
					  "type":"string",
					  "title":"item_4"
					}
				  }
				}
			}

		break;
	}
	
	form["postRender"] = function(renderedForm) {
					  $('#form1-button').click(function() {
						if (renderedForm.isValid(true)) {
						  var val = renderedForm.getValue();
						  preview.add(val, type);
						  $("#form_preview").alpaca(preview.form);
						  $("#controlsDialog").dialog("close");
						}
					  });
				  }
	$("#form1").alpaca(form);
	$("#controlsDialog").dialog("open");
	return false;
}


function updatePreview(obj, t){

	var tmp = preview["schema"]["properties"];
	var fields = preview["options"]["fields"];
	var nome = obj["titolo"];
	nome = $.trim(nome).replace(/\s+|'|\"/g, "");
	
	switch (t){
		case "date":
			tmp[nome] =  {
					  "type":"string",
					  "title":obj["titolo"],
					  "format" : t
					}
			fields[nome] = {
						"helper": "Cancella"
					}
		break;
		case "number":
			tmp[nome] =  {
					  "type":"number",
					  "title":obj["titolo"]
					}
			fields[nome] = {
						"helper": "Cancella"
					}
		break;
		case "textarea":
			tmp[nome] =  {
					  "type":"string",
					  "title":obj["titolo"]
					}
					
			fields[nome] = {
						"type": "textarea",
						"rows": 5,
						"cols": 40,
						"helper": "Cancella"
					}
				
			
		break;
		case "radio":
			var e = [];
            if(obj["item_1"]!='') e.push(obj["item_1"]);
			if(obj["item_2"]!='') e.push(obj["item_2"]);
			if(obj["item_3"]!='') e.push(obj["item_3"]);
			if(obj["item_4"]!='') e.push(obj["item_4"]);
			
			tmp[nome] =  {
				"title": obj["titolo"],
				"type":"string",
				"enum":e
			}
			fields[nome] = {
				"type": "select",
				"optionLabels": e,
				"helper": "Cancella"
			}
			
		break;
	}
				
	//$.extend(tmp, obj);
	//var test = JSON.stringify(tmp);
	
	preview["schema"]["properties"] = tmp;
	preview["options"]["fields"] = fields;

	preview["options"]["fields"][nome]['helper'] = "Cancella";
	//var test = JSON.stringify(preview);
	$("#form_preview").empty();
	$("#form_preview").alpaca(preview);
	$("#form_preview").on('click', '.alpaca-controlfield-helper', function(){
		var n = $(this).siblings('*[@name]').attr('name');
		delete(preview["schema"]["properties"][n]);
		delete(preview["options"]["fields"][n]);
		$("#form_preview").empty();
		$("#form_preview").alpaca(preview);
	});
}

function myRenderForm(p){

	$("#form_preview").alpaca(addPreviewDecoration(preview));
	$("#form_preview").on('click', '.alpaca-controlfield-helper', function(){
		var n = $(this).siblings('*[@name]').attr('name');
		delete(preview["schema"]["properties"][n]);
		delete(preview["options"]["fields"][n]);
		$("#form_preview").empty();
		$("#form_preview").alpaca(preview);
		});

}

function addPreviewDecoration(p){
	var helper = p
	for(var nome in helper["options"]["fields"]){
			helper["options"]["fields"][nome]['helper'] = "Cancella";
	}
	return helper;
}

function removePreviewDecoration(p){
	
	var helper = p
	for(var nome in helper["options"]["fields"]){
			delete helper["options"]["fields"][nome]['helper'];
	}
	return helper;
}