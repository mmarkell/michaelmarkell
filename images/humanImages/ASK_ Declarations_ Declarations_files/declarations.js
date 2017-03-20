var DECLARATIONS_APP = {};

// common concentration/track options edit functions

DECLARATIONS_APP.edit_select_list_options = function(){	
	var i, current_data = null;
	current_data = $(this).closest('div').find('input').val() ;
	if( current_data != null && current_data != '') {
		current_data = $.parseJSON( current_data ) ;
	}

	$('#related-options .related-item').remove() ;
	DECLARATIONS_APP.options_destination_container = $(this).closest('.select-list-options') ;

	if( current_data != null ) {
		for( i = 0; i < current_data.length; i++ ) {
			_APP.addRelatedItem($('#related-options'), current_data[i], 'option_item' , current_data[i], true) ;
		}
	}

	$('#edit-options-dialog').dialog('open') ;
};

DECLARATIONS_APP.edit_options_dialog_config = {
	autoOpen: false,
	modal: true,
	buttons: {
		Save: function(){
			var options_array = [], json_string;
			// Update both the human display and hidden field
			$('#related-options').find('input').each(function(){
				if( $(this).val() != '' ) {
					options_array.push( $(this).val()) ;
				}
			}) ;
			json_string = JSON.stringify( options_array ) ;
			DECLARATIONS_APP.options_destination_container.find('input').val(json_string) ;
			DECLARATIONS_APP.options_destination_container.find('.select-list-options-display').html(json_string.substr(1,json_string.length-2)) ;
			$(this).dialog('close') ;
		},
		Cancel: function(){
			$(this).dialog('close');
		}
	},
	close: function() {}
};

DECLARATIONS_APP.new_course_attribute = function(container) {
	var item_index = container.find('.related-item').length + 1;
	var related_item = $('<div class="related-item extra-padding"></div>');
	related_item.append('<span class="related-item-link">(<a class="removal-link remove-special">remove</a>)</span>') ;
	related_item.append('<textarea name="course_attributes_prompt[' + item_index + ']" id="course-attributes-prompt-' + item_index + '"></textarea>') ;
	related_item.append('<select name="course_attributes_type[' + item_index + ']" id="course-attributes-type-' + item_index + '" class="select-type">' +
		'<option value="radio">One Course</option>' +
		'<option value="checkbox">Many Courses</option>' +
		'<option value="dropdown">Dropdown Menu</option>' +
		'</select>') ;
	related_item.append('<div class="select-list-options" style="display:none;">' +
		'<input type="hidden" name="course_attributes_options[' + item_index + ']" id="course-attributes-options-' + item_index + '" value="" />' +
		'Options (<strong>required</strong>): <span class="select-list-options-display"></span> <span class="select-list-options-link">(<a class="edit-select-list-options">edit</a>)</span></div>') ;

	related_item.appendTo( container ) ;
};

DECLARATIONS_APP.new_additional_question = function(container) {
	var item_index = container.find('.related-item').length + 1;
	var related_item = $('<div class="related-item extra-padding"></div>');
	related_item.append('<span class="related-item-link">(<a class="removal-link remove-special">remove</a>)</span>') ;
	related_item.append('<textarea name="additional_questions_prompt[' + item_index + ']" id="additional-questions-prompt-' + item_index + '"></textarea>') ;
	related_item.append('<select name="additional_questions_type[' + item_index + ']" id="additional-questions-type-' + item_index + '" class="select-type">' +
		'<option value="text">Short Text</option>' +
		'<option value="textarea">Long Text</option>' +
		'<option value="dropdown">Dropdown Menu</option>' +
		'</select>') ;
	related_item.append('<div class="select-list-options" style="display:none;">' +
		'<input type="hidden" name="additional_questions_options[' + item_index + ']" id="additional-questions-options-' + item_index + '" value="" />' +
		'Options (<strong>required</strong>): <span class="select-list-options-display"></span> <span class="select-list-options-link">(<a class="edit-select-list-options">edit</a>)</span></div>') ;

	related_item.appendTo( container ) ;
};

DECLARATIONS_APP.update_options_visibility = function(container, question_type) {
	if( question_type == 'dropdown' ) {
		container.show() ;
	} else {
		container.hide() ;
		container.find('input').val('') ;
		container.find('span.select-list-options-display').html('') ;
	}
};


$(document).ready(function(){
	DECLARATIONS_APP.wysiwyg_declarations_config = {
			autoGrow: false,
			resizeOptions: false,
			rmUnwantedBr: true,
			rmUnusedControls: true,
			iFrameClass: 'jwysiwyg-iframe',
			initialContent: '',
			formHeight: '800px',
			css: _APP.approot + 'css/jwysiwyg-iframe.css',
			controls: {
				bold: {visible: true},
				italic: {visible: true},
				strikeThrough: {visible: true},
				underline: {visible: true},
				indent: {visible: true},
				outdent: {visible: true},
				undo: {visible: true},
				redo: {visible: true},
				insertOrderedList: {visible: true},
				insertUnorderedList: {visible: true},
				createLink: {visible: false},
				insertImage: {visible: false},
				insertTable: {visible: false},
				html: {visible: false},
				removeFormat: {visible: true}
			},
			plugins: {
				rmFormat: {rmMsWordMarkup: true}
			}
	} ;
	// We have some special requirements for declarations wysiwyg editors, so
	// there's a custom definition here.
	
	$('textarea.wysiwyg-declarations').wysiwyg( DECLARATIONS_APP.wysiwyg_declarations_config) ;
	
		DECLARATIONS_APP.jwysiwyg_config_noautogrow = {
			autoGrow: false,
			resizeOptions: true,
			rmUnwantedBr: true,
			rmUnusedControls: true,
			iFrameClass: 'jwysiwyg-iframe',
			css: _APP.approot + 'css/jwysiwyg-iframe.css',
			initialContent: '',
			controls: {
				bold: {visible: true},
				italic: {visible: true},
				strikeThrough: {visible: true},
				underline: {visible: true},
				indent: {visible: true},
				outdent: {visible: true},
				undo: {visible: true},
				redo: {visible: true},
				insertOrderedList: {visible: true},
				insertUnorderedList: {visible: true},
				createLink: {visible: true},
				insertImage: {visible: false},
				insertTable: {visible: false},
				html: {visible: false},
				removeFormat: {visible: true}
			}
	};
	
	
	
	
	
	$(document).on('click','.toggle-section',function(){
		var parent = $(this).closest('div.section');
		var contents = parent.find('div.requirement-content-container:first, .course-plan-course');
		var nested_contents = parent.find('div.nested-requirements');
		
		// The addClass/removeClass calls are in different places here because
		// the animation looks better if we straighten the corners _first_ when expanding,
		// but _last_ when collapsing.
		if( $(this).hasClass('ui-icon-triangle-1-e')) {
			parent.find('div.section-title:first').removeClass('section-title-collapsed');
			nested_contents.slideDown('fast');
			contents.slideDown('fast') ;
		} else {
			nested_contents.slideUp('fast');
			contents.slideUp('fast',function(){
				parent.find('div.section-title:first').addClass('section-title-collapsed');
			}) ;
		}

		$(this).toggleClass('ui-icon-triangle-1-e');
		$(this).toggleClass('ui-icon-triangle-1-s');
	});
	
	$(document).on('click','.toggle-level',function(){
		var depth = $(this).data('depth');
		var is_closed = $(this).data('closed') == 1;
		var selector = DECLARATIONS_APP.toggle_program_selector + ' > .section';
		if( depth > 0 ) {
			for(var i = 0; i < depth; i++ ) {
				selector += ' .nested-requirements > .section' ;
			}
		}
		
		$(selector).each(function(index,element){
			var parent = $(element);
			var contents = parent.find('div.requirement-content-container:first');
			var nested_contents = parent.find('div.nested-requirements');
			var section_title = parent.find('div.section-title:first');
			var disclosure_triangle = section_title.children('.toggle-section');


			// The addClass/removeClass calls are in different places here because
			// the animation looks better if we straighten the corners _first_ when expanding,
			// but _last_ when collapsing.
			if( is_closed ) {
				section_title.removeClass('section-title-collapsed');
				nested_contents.slideDown('fast');
				contents.slideDown('fast') ;
				disclosure_triangle.addClass('ui-icon-triangle-1-s');
				disclosure_triangle.removeClass('ui-icon-triangle-1-e');
			} else {
				nested_contents.slideUp('fast');
				contents.slideUp('fast',function(){
					section_title.addClass('section-title-collapsed');
				}) ;
				disclosure_triangle.removeClass('ui-icon-triangle-1-s');
				disclosure_triangle.addClass('ui-icon-triangle-1-e');
			}
		});
		
		$(this).data( 'closed', Math.abs($(this).data('closed') - 1) ) ;
	});
	
}) ;