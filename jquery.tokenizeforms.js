/* Inspiration for some of this code goes out to:
 *
 * jquery.tokeninput.js
 * on github at: http://github.com/loopj/jQuery-Tokenizing-Autocomplete-Plugin
 *
 * --
 * The rest of the credit goes to the collective world that works on this.
 * Feel free to fork this at: http://github.com/m3talsmith/jquery-tokenizeforms
 * --
 * Licensed under GPLv3: http://www.gnu.org/licenses/gpl-3.0.html
 * --
 * Todo's:
 *
 * - Add mouse handlers for results list
 * - Check for any IE bugs
 * - Add nice animations
 * - Add token delete mouse handlers
 * - Add Data Caching
 * - Add Query Bypassing
 * - Add query term highlighting
 * - Add auto select result list item on queryterm whendropdown is shown
 *
 * -- 
 * Status: 95% Complete
 *
 */
 
$.fn.tokenizeInput = function(options) {
  var options = $.extend(options);
  
  // make sure critical default values are not null
    if(options.url        == undefined){options.url         = "";}
    if(options.queryToken == undefined){options.queryToken  = "tokenizeForm";}
  // --
  
  return this.each(function(){
    var token_list = $.TokenList(this, options);
  });
}

$.TokenList = function(input_field, options) {
  // need to enter some keycode for keyboard operation first
    var key = {
        backspace: 8,
        tab: 9,
        enter: 13,
        esc: 27,
        left: 37,
        up: 38,
        right: 39,
        down: 40,
        comma: 188,
        apple: 91
    };
  // --
  
  // callbacks
    var onSelectToken   = function(){return true;};
    var onDeselectToken = function(){return true;};
    var onNewToken      = function(){return true;};
    var onRemoveToken   = function(){return true;};
  // --
  
  // check for callbacks in options
    if(options.onSelectToken)   { onSelectToken   = options.onSelectToken;    }
    if(options.onDeselectToken) { onDeselectToken = options.onDeselectToken;  }
    if(options.onNewToken)      { onNewToken      = options.onNewToken;       }
    if(options.onRemoveToken)   { onRemoveToken   = options.onRemoveToken;    }
  // --
  
  var input_field = $(input_field);
  var parent = $(input_field).parent();
  
  var token_list = $("<div />")
    .attr("id", input_field.attr("id") + "_token_list")
    .addClass("token-list")
    .appendTo(parent)
    .click(function(){false_input_field.focus();});
  
  var tokens = [];
  var token_selected = false;
  
  var result_list = $("<div />")
    .attr("id", input_field.attr("id") + "_result_list")
    .addClass("query-results")
    .appendTo(parent);
  hide_dropdown();
  
  var results = [];
  var selected_result = "";
  
  var disabled_form_submit = false;
  var dropdown_hidden = false;
  
  if(input_field.val() != "") {
    $(input_field.val().split(",")).each(function(){tokens.push(this);});
  }
  
  $(tokens).each(function(){
    create_token(this);
  });
  
  var false_input_field = $("<input type='text' />")
    .addClass("token-input-field")
    .css({
      id: "false-input-field"
    })
    .focus(function(){
      if(token_selected) { deselect_token(); }
      run_query($(this).val());
      show_dropdown();
    })
    .blur(function(){
      if(token_selected) { deselect_token(); }
      hide_dropdown();
    })
    .keydown(function(event){
      switch(event.keyCode) {
        case key.apple:
          break;
        case key.tab:
          // break default tab use for this field
            if(options.tabCompletion){event.preventDefault();}
          // --
        case key.enter:
          disable_form_submit();
          
          if(selected_result != "") { create_token(selected_result.html()); }
          else { create_token(String($(this).val()).replace(",","")); }
          
          $(this).appendTo(token_list).focus().val("");
          
          if(token_selected) { unselect_token(); }
          clear_results();
          hide_dropdown();
          
          event.stopImmediatePropagation();
          enable_form_submit();
          return false;
          break;
        case key.down:
          select_next_result();
          event.stopImmediatePropagation();
          return false;
          break;
        case key.up:
          select_previous_result();
          event.preventDefault();
          return false;
          break;
      }
    })
    .keyup(function(event){
      switch(event.keyCode) {
        case key.apple:
        case key.up:
        case key.down:
          event.preventDefault();
          break;
        case key.comma:
          create_token(String($(this).val()).replace(",",""));
          $(this).appendTo(token_list).focus().val("");
          if(token_selected) { unselect_token(); }
          return false;
          break;
        case key.backspace:
          if(token_selected){
            remove_token();
          } else if($(this).val().length <= 0 && !token_selected) {
            select_token();
          } else { run_query($(this).val()); }
          run_query($(this).val());
          break;
        case key.esc:
          hide_dropdown();
          $(this).blur();
          break;
        default:
          if(token_selected) { deselect_token(); }
          run_query($(this).val());
      }
    });
  false_input_field.appendTo(token_list);
  
  input_field.focus(function(){false_input_field.focus();});
  input_field.css("display", "none");
  
  // fix a race condition with the enter key
    init_form_submit();
    
    function init_form_submit() {
      var form = token_list.parents().find("form:first");
      form.bind("submit", function(){
        if(disabled_form_submit){return false;}
        return true;
      });
    }
    
    function disable_form_submit() {
      disabled_form_submit = true;
    }
    
    function enable_form_submit() {
      disabled_form_submit = false;
    }
  // --
  
  function create_token(value) {
    var token = $("<span>" + value + "</span>")
      .addClass("token-complete")
      .appendTo(token_list);
    onNewToken();
  }
  
  function deselect_token() {
    token_list.find(".token-selected:first")
      .removeClass("token-selected")
      .addClass("token-complete");
    token_selected = false;
    onDeselectToken();
  }
  
  function select_token() {
    token_list.find(".token-complete:last")
      .removeClass("token-complete")
      .addClass("token-selected");
    token_selected = true;
    onSelectToken();
  }
  
  function remove_token() {
    token_list.find(".token-selected:first").remove();
    token_selected = false;
    clear_results();
    hide_dropdown();
    onRemoveToken();
  }
  
  function show_dropdown() {
    result_list.show();
    dropdown_hidden = false;
  }
  
  function hide_dropdown() {
    result_list.hide();
    dropdown_hidden = true;
  }
  
  function clear_results() {
    results = [];
    result_list.empty();
    selected_result = "";
  }
  
  function select_next_result() {
    if(selected_result == "") {
      selected_result = result_list.children(":first");
    } else if(selected_result.next().html() != null) {
      selected_result.removeClass("query-result-selected");
      selected_result = selected_result.next();
    }
    selected_result.addClass("query-result-selected");
  }
  
  function select_previous_result() {
    if(selected_result != "" && result_list.children().index(selected_result.prev()) >= 0) {
      selected_result.removeClass("query-result-selected");
      selected_result = selected_result.prev();
    }
    selected_result.addClass("query-result-selected");
  }
  
  function populate_dropdown(json) {
    clear_results();
    $(json).each(function(){
      results.push(this.name);
      var result = $("<span>" + this.name + "</span>")
        .addClass("query-result-token")
        .appendTo(result_list);
    });
    if(dropdown_hidden){show_dropdown();}
  }
  
  function run_query(query){
    // setup simple variables for complex builds
    var queryDelimiter = options.url.indexOf("?") < 0 ? "?" : "&";
    var url = options.url + (options.disableQueryToken != undefined ? query : queryDelimeter + options.queryToken + "=" + query);
    var type = options.method != undefined ? options.method : "get";
    
    $.ajax({
      type:     type,
      url:      url,
      dataType: "json",
      success:  function(json, status) {
        populate_dropdown(json);
      }
      // error:    function(request, status, errorMessage) {alert(errorMessage);},
      // complete: function(request, status) {alert(status);}
    });
  }
  
  return token_list;
}