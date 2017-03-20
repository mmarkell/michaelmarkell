/* global DECLARATIONS_APP, _APP, PROGRAM_DEFINITION */

DECLARATIONS_APP.toggle_program_selector = '#program-plan' ;

DECLARATIONS_APP.status_icons = [
	'fa-check',
	'fa-circle',
	'fa-circle-o'
];

DECLARATIONS_APP.get_default_program_item_status = function(){
	return {
		unapproved_substitutions: 0,
		credits: 0,
		potential_credits: 0,
		is_satisfied: true,
		is_completed: true
	};
};

/*
 * Display the welcome message for the selected concentration, and set the 
 * DECLARATIONS_APP.welcome_viewed flag to true. This prevents unwanted displays
 * of the welcome message if the user changes something in the degree selection.
 */
DECLARATIONS_APP.show_welcome = function(){
	DECLARATIONS_APP.welcome_viewed = true ;
	$('#welcome-message').dialog('open') ;
};

/*
 * Update the messages we need to display based on the concentration, degree and track.
 * Also resets the "welcome_viewed" flag so that messages get displayed.
 */
DECLARATIONS_APP.update_messages = function(concentration_id, degree_id, track_id) {
	DECLARATIONS_APP.welcome_viewed = false ;

	$('#courseplan-message').load(
		_APP.approot + 'rest/concentrations/courseplanmessage?concentration_id=' + concentration_id + '&degree_id=' + degree_id + '&track_id=' + track_id,
		function(){
			if( !$.trim($('#courseplan-message').html()).length ) {
				$('#courseplan-message').html('Enter the courses you plan to apply to your declaration below.') ;
			} 
		}
	) ;

	$('#welcome-message').load(
		_APP.approot + 'rest/concentrations/welcomemessage?concentration_id='+concentration_id+'&degree_id='+degree_id+'&track_id='+track_id,
		function(){}
	) ;
} ;

DECLARATIONS_APP.refresh_engaged_scholars_form = function(){
	$.ajax({
		type: 'GET',
		url: _APP.approot + 'rest/engagedscholars/form',
		dataType: 'html',
		cache: false,
		data: {
			concentration_id: $('#concentration-id').val(),
			degree_id: $('#degree-id').val(),
			track_id: $('#track-id').val(),
			term_id: $('#term-id').val(),
			declaration_id: $('#_id').val(),
			editable: DECLARATIONS_APP.editable
		},
		success: function(data){
			$('#declaration-section-engaged-scholars').replaceWith(data) ;
			$('#declaration-section-engaged-scholars textarea.wysiwyg-declarations').wysiwyg(DECLARATIONS_APP.wysiwyg_declarations_config);
		}
	});
};




DECLARATIONS_APP.update_program_plan_narrative = function( title, narrative ){
	$('#programplan-message').html('<div><strong>'+title+'</strong></div><div>'+narrative+'</div>') ;
} ;

/*
 * Checks to see if we currently have a program definition available. If we do,
 * then the user will have the option to view either the course or program plan.
 * If not, then only the course plan will be visible. Also loads program plan data
 * into the DOM.
 */
DECLARATIONS_APP.update_plan_toggle = function() {
	if( PROGRAM_DEFINITION.saved_program_definition == null || $.isEmptyObject( PROGRAM_DEFINITION.saved_program_definition )) {
		PROGRAM_DEFINITION.clear();
		$('.plan-view.program-plan').removeClass('selected');
		$('.plan-view.course-plan').addClass('selected');
		
		$('.plan-toggle').removeClass('selected');
		$('.plan-toggle.course-plan').addClass('selected');
		$('.plan-toggle.program-plan').hide();
	} else {
		PROGRAM_DEFINITION.load();
		DECLARATIONS_APP.load_program_plan();
		$('.plan-toggle.program-plan').show();
	}
};


DECLARATIONS_APP.toggle_program_plan_diff = function( show_courses_diff ) {
	var diff_keys ;
	if( DECLARATIONS_APP.program_plan_diff != null ) {
		if( show_courses_diff ) {
			create_removed_course = function(course) {
				var output = '' ;
				if( course.id != null ) {
					output += '<div class="course program-plan-diff diff-dropped">' ;
					output += '<div>' + course.subject_code + ' ' + course.course_number + '</div>' ;
					output += '<div>' + course.course_title + '</div>' ;
					output += '</div>' ;
				} else {
					output += '<div class="course non-course program-plan-diff diff-dropped">' ;
					output += '<div><em>(file removed)</em></div>' ;
					output += '</div>' ;
				}
				return output ;
			} ;


			diff_keys = Object.keys( DECLARATIONS_APP.program_plan_diff ) ;
			if( diff_keys.length > 0 ) {
				$.each(DECLARATIONS_APP.program_plan_diff,function(uuid, item){
					var container = $('#' + uuid ) ;

					switch( item.state ) {
						case 'added':
							container.find('.course').addClass('program-plan-diff diff-added diff-added-new') ;
							break ;
						case 'dropped':
							// add former course to this item and apply the special diff classes
							// TODO: add proper handling for non-course requirements
							container.find('.course-plan-course').html(create_removed_course(item.planitem.declarationCourse));
							break ;
						case 'changed':
							container.find('.course').addClass('program-plan-diff diff-added') ;
							$(create_removed_course(item.old)).appendTo(container.find('.course-plan-course')) ;
							break ;
						default :
							// unknown state
					}
				});
			}
		} else {
			$.each(DECLARATIONS_APP.program_plan_diff,function(uuid, item){
				var container = $('#' + uuid ) ;
				container.find('.program-plan-diff.diff-dropped').remove() ;
				container.find('.program-plan-diff.diff-added').removeClass('program-plan-diff diff-added diff-added-new') ;
			});
		}
			
	}
} ;

/*
 * Display the program plan with all unused items hidden.
 */
DECLARATIONS_APP.winnow_program_plan = function() {
	$('.course-plan-course:empty').closest('.requirement-item').addClass('winnowed') ;
	$('.requirement-content-container *').addClass('winnowed');
	$('.requirement-group').each(function(){
		if( $(this).find('.requirement-item.winnowed').length == $(this).find('.requirement-item').length){
			$(this).addClass('winnowed');
		}
	}) ;
};

DECLARATIONS_APP.unwinnow_program_plan = function() {
	$('.winnowed').removeClass('winnowed') ;
} ;


/*
 * Set available degrees based on the current concentration.
 */
DECLARATIONS_APP.update_degree_menu = function(concentration_id) {
	var data = {};
	data.concentration_id = concentration_id ;
	if( concentration_id == $('#incoming-concentration-id').val()) {
		data.term_id = $('#term-id').val() ;
	}

	_APP.populateSelectViaAJAX(
		_APP.approot + 'rest/degrees/menu',
		data,
		$('#degree-id')
	) ;
	DECLARATIONS_APP.update_tracks_menu( $('#degree-id').val(), $('#concentration-id').val()) ;
};

/*
 * Update available tracks based on the degree and concentration.
 */
DECLARATIONS_APP.update_tracks_menu = function(degree_id, concentration_id) {
	var data = {
			degree_id: degree_id,
			concentration_id: concentration_id
		};
	if( concentration_id == $('#incoming-concentration-id').val()) {
		data.term_id = $('#term-id').val() ;
	}
	_APP.populateSelectViaAJAX(
		_APP.approot + 'rest/tracks/menu',
		data,
		$('#track-id')
	) ;
	DECLARATIONS_APP.update_advisor_menu( $('#concentration-id').val(), $('#track-id').val(), true) ;
};

/*
 * Update the advisors menu based on the concentration and track.
 */
DECLARATIONS_APP.update_advisor_menu = function(concentration_id, track_id, include_current_selection) {
	var data = {
		concentration_id: concentration_id,
		track_id: track_id,
		verify_selection_method: 1,
		include_prompt: 1
	} ;
	if( include_current_selection ) {
		data.current_advisor_id = $('#preferred-advisor-id').val() ;
	}
	
	_APP.populateSelectViaAJAX(
		_APP.approot + 'rest/concentrationadvisors/menu',
		data,
		$('#preferred-advisor-id')
	) ;
	
	if( include_current_selection ) {
		$('#preferred-advisor-id').val(data.current_advisor_id) ;
	}
	
};

/*
 * Refresh the course plan data via AJAX. This should get triggered on the initial
 * page load, and then again if the concentration changes to deal with different
 * course descriptors expected by a concentration.
 */
DECLARATIONS_APP.refresh_course_plan = function(conc_changed) {
	var update_attr;
	if( conc_changed == true ) {
		update_attr = 1 ;
	} else {
		update_attr = 0 ;
	}
	$.ajax({
		type: 'GET',
		url: _APP.approot + 'rest/declaration/courseplan',
		dataType: 'json',
		cache: false,
		async: false,
		success: DECLARATIONS_APP.render_course_plan,
		data: {
			concentration_id: $('#concentration-id').val(),
			degree_id: $('#degree-id').val(),
			track_id: $('#track-id').val(),
			declaration_id: $('#_id').val(),
			update_attr: update_attr
		}
	}) ;
} ;

/*
 * Make sure the student has an override for the selected concentration if one
 * is required.
 */
DECLARATIONS_APP.verify_override_status = function(concentration_id) {
	$.ajax({
		type: 'GET',
		url: _APP.approot + 'rest/concentrations/verifyoverride',
		cache: false,
		dataType: 'json',
		success: function(data) {
			var override_message = 'You must have an override for that concentration before you may select it here. Please select a different concentration or contact the department for an override.';
			if( data.override_status == 'ok') {
				// enable save
				$('#degree-selection-link').html('Set Degree Selection') ;
			} else {
				// warn and disable save
				$('#degree-selection-link').html('<b>Override Required</b>') ;
                if (data.override_message != '') {
                    override_message = data.override_message ;
                }
				$('#override-message').html(override_message).dialog('open');
			}
		},
		data: {concentration_id: concentration_id}
	}) ;
};

/*
 * Get the available courses for a subject code.
 */
DECLARATIONS_APP.update_courses_menu = function(subject) {
	_APP.populateSelectViaAJAX(
		_APP.approot + 'rest/courses/menu',
		{subject: subject},
		$('#course-number-select')
	) ;
};

/*
 * Tweak the interface based on whether "brown" or "non-brown" is selected, so
 * that we can ask for an institution name.
 */
DECLARATIONS_APP.update_for_selection_method = function() {
	$('.brown,.non-brown,.manual-course,.select-course').hide() ;
	$('.' + $('#course-source').val() + '.' + $('#institution-select').val()).show() ;
};

/*
 * Rebuild the course modal with the appropriate course attributes as set by the concentration.
 */
DECLARATIONS_APP.reset_course_modal = function() {
	var declaration_id = null ;
	
	if( $('#incoming-concentration-id').val() == $('#concentration-id').val() ) {
		declaration_id = $('#_id').val() ;
	}
	
	$.ajax({
			type: 'GET',
			url: _APP.approot + 'rest/declaration/coursemodal',
			dataType: 'html',
			cache: false,
			success: function(d){
				var min_term = Math.min(parseInt(DECLARATIONS_APP.current_term),parseInt($('#course-term').val())) ;
				$('#edit-course-dialog').html(d) ;
				
				
				$('#course-search').autocomplete({
						source: _APP.approot+'ajax/searchcourses/?from_term='+min_term,
						minLength: 4,
						select: function(event, ui) {
							$('#course-subject').val(ui.item.subject) ;
							DECLARATIONS_APP.update_courses_menu(ui.item.subject) ;
							$('#course-number-select option:contains("' + ui.item.course_title + '"):first').prop('selected','selected') ;
						}
					})
					.data('ui-autocomplete')._renderItem = function( ul, item ) {
							return $('<li></li>')
								.data('ui-autocomplete-item', item)
								.append( '<a>' +
									'<span class="autocomplete-name">' + item.course_identification + '</span>' +
									'<span class="autocomplete-title">' + item.title_long_desc + '</span>' +
									'<span class="autocomplete-active-terms">(' + 
										$.trim(_APP.friendly_term(item.start_term)) + ' \u2013 ' + 
										$.trim(_APP.friendly_term(item.end_term)) + ')</span>' +
									'</a>'
								)
								.appendTo(ul);
						} ;
				_APP.addProgressSpinner( $('#course-search'), 'autocompletesearch', 'autocompleteopen' ) ;
				
				$(document).on('change','#academic-history-menu',function(){
					var course = {} ;
					var history_item ;
					
					history_item = $(this).find('option:selected').data('course') ;
					if( $.isEmptyObject(history_item)) {
						$('.course-summary .history-institution').html('') ;
						$('.course-summary .history-subject-code').html('') ;
						$('.course-summary .history-course-number').html('') ;
						$('.course-summary .history-course-title').html('') ;
						$('.course-summary .history-term').html('') ;
					} else {
						course.is_brown = history_item.institution_code == null ? 1 : 0 ;
						course.institution = course.is_brown == 0 ? history_item.institution_desc : 'Brown' ;
						course.subject_code= history_item.subject_code ;
						course.course_number = history_item.course_number ;
						course.course_title = history_item.course_title ;
						course.sequence_number = history_item.sequence_number ;
						course.term_id = history_item.term_id ;						
						
						$('.course-summary .history-institution').html(course.institution) ;
						$('.course-summary .history-subject-code').html(course.subject_code) ;
						$('.course-summary .history-course-number').html(course.course_number) ;
						$('.course-summary .history-course-title').html(course.course_title) ;
						$('.course-summary .history-term').html(_APP.friendly_term(course.term_id)) ;
					}
					$('#edit-course-form .course-summary').data('course',course) ;
				});
								
				DECLARATIONS_APP.update_for_selection_method() ;
			},
			data: {
				concentration_id: $('#concentration-id').val(),
				degree_id: $('#degree-id').val(),
				track_id: $('#track-id').val(),
				semester_level: DECLARATIONS_APP.semester_level,
				is_brdd: DECLARATIONS_APP.is_brdd,
				declaration_id: declaration_id
			}
		}) ;
};

/*
 * Generate the course plan table, including HTML5 data elements.
 */
DECLARATIONS_APP.render_course_plan = function(course_plan, with_diff) {
	/*
	 * All course plans will include the following columns:
	 * - Institution
	 * - Course
	 * - Title
	 * - Term
	 * - Actions
	 *
	 * We'll need to inspect the course attributes to determine what columns go
	 * between term and actions
	 */
	var course, i, course_attributes, dec_course_id, course_id, row_class, row_course_id, cell_class, max_attribute_count = 0, existing_course_attributes;
	var new_table = $('<table id="sortableTable" class="tablesorter tablesorter-ask"></table>');
	var table_head = $('<thead></thead>');
	var table_body = $('<tbody></tbody>');
	var table_row = $('<tr></tr>');
	var comments_container = $('<div></div>');
	
	$('#course-attributes-changed').hide();
	
	
	if( typeof with_diff == 'undefined' || with_diff == null ) {
		with_diff = false ;
	}
	if( !DECLARATIONS_APP.disable_progress_indicators ) {
		table_row.append('<th>Status</th>') ;
	}
	
	table_row.append('<th>Institution</th>') ;
	table_row.append('<th>Course</th>') ;
	table_row.append('<th>Title</th>') ;
	table_row.append('<th>Term</th>') ;
    table_row.append('<th>Grade</th>');

	course_attributes = $.parseJSON( course_plan.declaration.course_attributes_template_json ) ;
	$('#courseplan').data('course_attributes_template', course_attributes) ;
	$('#courseplan').data('course_plan', course_plan) ;

	if( course_attributes !== null && course_attributes.length > 0 ) {
		max_attribute_count = course_attributes.length ;
		for(i = 0; i < course_attributes.length; i++) {
			table_row.append('<th>' + course_attributes[i].name + '</th>') ;
		}
	}

	// Check the course plan to be sure there are not extra course attributes 
	// that have been removed. Add extra columns as necessary.
	
	
	for(i = 0; i < course_plan.declaration_courses.length; i++ ) {
		if( typeof course_plan.declaration_courses[i].course_attributes_responses == 'undefined' ) {
			existing_course_attributes = $.parseJSON( course_plan.declaration_courses[i].course_attributes_responses_json ) ;
		} else {
			existing_course_attributes = course_plan.declaration_courses[i].course_attributes_responses ;
		}

		if((existing_course_attributes !== null) && (existing_course_attributes.length > 0 )) {
			max_attribute_count = Math.max(existing_course_attributes.length, max_attribute_count);
		}
	}
	
	if( max_attribute_count > course_attributes.length ) {
		for( i = course_attributes.length; i < max_attribute_count; i++ ) {
			table_row.append('<th>?</th>') ;
		}
	}

	table_row.append('<th class="{sorter:false}">&nbsp;</th>') ;
	table_head.append(table_row) ;

	new_table.append(table_head) ;
	new_table.append(table_body) ;

	// TODO: check for an existing table and pull the table sorting from it so that the sorts are maintained.

	$('#datatable').html(new_table) ;


	for(i = 0; i < course_plan.declaration_courses.length; i++) {
		course = course_plan.declaration_courses[i] ;

		if( course.comments != '') {
			comments_container.append('<div><span class="comment-course-badge">' + course.subject_code + ' ' + course.course_number + '</span>'+course.comments+'</div>') ;
		}

		course_id = course.id;

		// check whether this is a new course
		row_class = '' ;
		if( with_diff == true) {
			if( typeof course_plan.courses_diff[course_id] !== 'undefined' ) {
				if( course_plan.courses_diff[course_id].state == 'new') {
					row_class = 'new-course ' ;
				}
			}
		}
		// is this an overlap course?
		if( course.overlaps.length > 0 ) {
			row_class += 'overlap-course ' ;
		}


		table_row = $('<tr id="dec_course_' + course.id + '" class="' + row_class + '"></tr>') ;
		table_row.html( DECLARATIONS_APP.course_columns(course, with_diff, max_attribute_count)) ;

		table_row.data('course', course) ;
		table_body.append(table_row) ;

	}

	$('#courseplan-student-comments').html(comments_container) ;

	// dropped or changed courses
	if( with_diff == true ) {

		for( dec_course_id in course_plan.courses_diff ) {

			// add any dropped courses
			if( course_plan.courses_diff[dec_course_id].state == 'dropped') {
				table_row = $('<tr id="dec_course_' + course.id + '" class="dropped-course"></tr>') ;
				table_row.html( DECLARATIONS_APP.course_columns( course_plan.courses_diff[dec_course_id].course, with_diff)) ;
				table_body.append( table_row ) ;
			} else if( course_plan.courses_diff[dec_course_id].state == 'changed') {
				for( i = 0; i < course_plan.courses_diff[dec_course_id].diff_columns.length; i++ ) {
					row_course_id = '#dec_course_' + dec_course_id ;
					cell_class = '.'+course_plan.courses_diff[dec_course_id].diff_columns[i] ;

					$(row_course_id).find(cell_class).addClass('changed') ;
				}
			}
		}
	}

	new_table.tablesorter({widgets:['zebra','stickyHeaders']}) ;
	new_table.trigger('update') ;

};

/*
 * Get CSS class to display completion status for a course.
 * 
 * @param {type} course
 * @returns {String} */
DECLARATIONS_APP.get_course_status_class = function(course) {
	var status_class ;
	status_class = 'future-term' ;
	if( course !== null ) {
		if( course.is_complete == true ) {
			if( course.banner_match_partial == null ) {
				status_class = 'ok' ;
			} else {
				status_class = 'credit' ;
			}
		} else {
	//		if( parseInt(course.term_id) == parseInt(course.banner_grade)) {
			if( typeof course.banner_grade !== 'undefined' && course.banner_grade !== null && course.banner_grade.length == 6 ) {
				status_class = 'currently-enrolled' ;
			} else {
				if( parseInt(course.term_id) <= parseInt(DECLARATIONS_APP.current_term )) {
					if( course.banner_grade == null) {
						status_class = 'not-taken' ;
					} else {
						status_class = 'no-credit' ;
					}
				}
			}
		}
	}
		
	return status_class ;
};

/*
 * Build columns for a course, including all attributes and diff data.
 */
DECLARATIONS_APP.course_columns = function(course, with_diff, max_attribute_count) {
	var cells = '';
	var status_class, i, cell_value, course_attributes, col_count = 0;
	
	if( typeof max_attribute_count == 'undefined') {
		max_attribute_count = 0 ;
	}
	// start by building the table cells, then we'll decide at the end whether we should append or replace data in the table
	
	// determine course status
	status_class = DECLARATIONS_APP.get_course_status_class(course) ;
	
	if( !DECLARATIONS_APP.disable_progress_indicators ) {
		cells += '<td class="dec-course-status"><span class="course-status-indicator status-'+status_class+'"><span>'+status_class.replace('-',' ')+'</span></span></td>' ;
	}
	
	cells += '<td class="dec-course-institution">' + course.institution + '</td>' ;
	if( course.subject_code == null ) {
		cells += '<td class="dec-course-course-number">' + course.course_number + '</td>' ;
	} else {
		cells += '<td class="dec-course-course-number">' + course.subject_code + ' ' + course.course_number + '</td>' ;
	}

	cells += '<td class="dec-course-course-title">' + course.course_title + '</td>' ;
	cells += '<td class="dec-course-term-id">' ;
	cells += '<span class="force-sort">' + course.term_id + '</span>' ;
	cells += _APP.friendly_term(course.term_id) ;
	if( typeof course.banner_match_partial != 'undefined' && course.banner_match_partial !== null ) {
		cells += ' (<em>' + _APP.friendly_term(course.banner_match_partial.term_id) + '</em>)' ;
	}
	cells += '</td>' ;

    if (course.banner_grade != null) {
		cells += '<td class="dec-course-grade centered-column">' ;
		if( course.banner_grade.length == 6 ) {
			if( course.banner_match_partial !== null ) {
				cells += '(<em>'+_APP.friendly_term(course.banner_grade)+'</em>)' ;
			} else {
				cells += _APP.friendly_term(course.banner_grade) ;
			}
			
		} else {
			if( course.banner_match_partial !== null ) {
				cells += '(<em>'+course.banner_grade+'</em>)' ;
			} else {
				cells += course.banner_grade ;
			}
			
		}
		cells += '</td>' ;
		
//        if (isNaN(parseInt(course.banner_grade)) == true ) {
//            cells += '<td class="dec-course-grade centered-column">' + course.banner_grade + '</td>' ;
//        } else {
//            cells += '<td class="dec-course-grade centered-column">' + _APP.friendly_term(course.banner_grade) + '</td>' ;
//        }
    }
    else {
        cells += '<td class="dec-course-grade centered-column"></td>';
    }


    if( typeof course.course_attributes_responses == 'undefined' ) {
		course_attributes = $.parseJSON( course.course_attributes_responses_json ) ;
	} else {
		course_attributes = course.course_attributes_responses ;
	}

	if((course_attributes !== null) && (course_attributes.length > 0 )) {
		col_count = course_attributes.length ;
		for( i = 0; i < course_attributes.length; i++ ) {
			if( course_attributes[i].type == 'dropdown') {
				// with imported data this doesn't exist-- the value isn't the key, it's the value from the dropdown
				cell_value = course_attributes[i].options[course_attributes[i].value] ;
				if( typeof(cell_value) == 'undefined') {
					cell_value = course_attributes[i].value ;
				}
			} else {
				if( course_attributes[i].value == 1 ) {
					cell_value = '<span class="checkmark-checked"><span class="hideme">1</span></span>' ;
				} else {
					cell_value = '<span class="hideme">2</span>' ;
				}
			}
			cells += '<td class="dec-course-attribute-' + course_attributes[i].id + '">' + cell_value + '</td>' ;
		}
	}
	
	if( max_attribute_count != col_count ) {
		for( i = Math.min(col_count,max_attribute_count); i < Math.max(col_count,max_attribute_count); i++ ) {
			cells += "<td>&nbsp;</td>";
		}
	}
	
	

	if( DECLARATIONS_APP.editable ) {
		cell_value = '<a class="edit-course">Edit</a>&nbsp;|&nbsp;<a class="drop-course">Delete</a>&nbsp;';
	} else {
		cell_value = '' ;
	}
	
	if (DECLARATIONS_APP.editable && DECLARATIONS_APP.course_attributes_changed(course_attributes)) {
		$('#course-attributes-changed').show() ;
		cell_value += '<span class="ui-icon ui-icon-alert ui-icon-right" title="Course attributes definition has changed. Edit course to resolve."></span>';
	}
	
	if( course.comments != '' ) {
		cell_value += '<span class="course-comments ui-icon ui-icon-comment ui-icon-right ui-icon-clickable" role="button" aria-label="view student comment"></span>' ;
	}
	
	cells += '<td class="actions">'+cell_value+'</td>' ;

	return cells ;
};


DECLARATIONS_APP.update_course_plan = function(course) {
	var cells = '';
	var table_row;
	var max_attributes_count = 0;
	var course_attributes_template = $('#courseplan').data('course_attributes_template');
	
	if( course_attributes_template !== null && course_attributes_template.length > 0 ) {
		max_attributes_count = course_attributes_template.length ;
	}

	cells = DECLARATIONS_APP.course_columns( course, null, max_attributes_count ) ;

	table_row = $('#dec_course_' + course.id) ;
	if( table_row.length == 0 ) {
		table_row = $('<tr id="dec_course_' + course.id +'"></tr>').html(cells) ;
		$('#sortableTable tbody').append(table_row) ;
	} else {
		table_row.html($(cells)) ;
	}
	table_row.data( 'course', course ) ;
	// is this an overlap course?
	if( course.overlaps.length > 0 ) {
		table_row.addClass('overlap-course') ;
	} else {
		table_row.removeClass('overlap-course') ;
	}

	DECLARATIONS_APP.update_program_plan_courses() ;
};

/*
 * Check the course attributes for a particular course against the current 
 * attributes template. The attributes have changed if any of the following is true:
 * - only one or the other is 'undefined'
 * - counts differ
 * - the name, type or available options don't match
 * 
 * @returns {Boolean}
 */
DECLARATIONS_APP.course_attributes_changed = function(course_attributes) {
	var i;
	var course_attributes_template = $('#courseplan').data('course_attributes_template');
		
	if( course_attributes_template == null && course_attributes == null ) {
		return false ;
	}
	if( (course_attributes_template == null && course_attributes != null) || (course_attributes_template != null && course_attributes == null) ) {
		return true ;
	}
	if( course_attributes_template.length != course_attributes.length ) {
		return true ;
	}
	
	for( i = 0; i < course_attributes.length; i++ ) {
		// check whether the name, type or options differ
		if( course_attributes[i].name != course_attributes_template[i].name ) {
			return true ;
		}
		if( course_attributes[i].type != course_attributes_template[i].type ) {
			return true ;
		}
		if( !( $(course_attributes[i].options).not(course_attributes_template[i].options).length == 0 && $(course_attributes_template[i].options).not(course_attributes[i].options).length == 0 )) {
			return true ;
		}
	}
	
	return false ;
};


/*
 *  This does a couple things-- it toggles the text and buttons in the dividing
 *  section between the degree selection and the rest of the declaration, and
 *  it also triggers the appropriate methods for enabling and disabling each section
 *  of the overall form.
 */
DECLARATIONS_APP.set_degree_selection_state = function(state) {
	var conc_changed = false;
	var track_changed = false;
	var degree_changed = false;
	var confirm_response ;
	if( state == 'set' ) {
		$('#declaration-degree-info').html(
				'Once you\'ve made your selections in the fields above, click \"Set Degree Selection\" to continue.'
		) ;
		$('#degree-selection-link').html('Set Degree Selection') ;
		
		// This is resetting the menu back to the default state, which we don't 
		// want when the user gets to this state after selecting a concentration
		// Commenting out before deletion to be sure there are no ill effects.
		//$('#preferred-advisor-id').html( $('#available-advisors').html()) ;
		
		$('.degree-menu-set:not(.locked)').show() ;
		$('.degree-menu-selection:not(.locked)').hide() ;
		$('.degree-menu-info.locked').show() ;
		$('#welcome-message-link').hide() ;
		
		DECLARATIONS_APP.set_declaration_body_state('read') ;

	} else {
		// User has made a degree/concentration/track/advisor choice.
		// Validate selections
		if( $('#degree-id').val() == '' || $('#concentration-id').val() == '' ) {
			alert('You must select at least a degree and concentration before continuing') ;
			return false ;
		}
		conc_changed = $('#concentration-id').val() != $('#incoming-concentration-id').val();
		track_changed = $('#track-id').val() != $('#incoming-track-id').val();
		degree_changed = $('#degree-id').val() != $('#incoming-degree-id').val();

		if( conc_changed || track_changed ) {
			if( !confirm('If you continue, you will lose any edits you have made since your last save. Are you sure you want to do this?')) {
				return false ;
			}
		}

		// Copy selections into the display fields.
		$('#degree-display').html( $('#degree-id option:selected').html()) ;
		$('#concentration-display').html( $('#concentration-id option:selected').html()) ;
		$('#track-display').html( $('#track-id option:selected').html()) ;
		$('#preferred-advisor-display').html( $('#preferred-advisor-id option:selected').html()) ;

		DECLARATIONS_APP.reset_course_modal() ;
		DECLARATIONS_APP.refresh_course_plan(conc_changed || track_changed || DECLARATIONS_APP.update_triggered) ;
		DECLARATIONS_APP.update_messages($('#concentration-id').val(), $('#degree-id').val(), $('#track-id').val()) ;
		$.ajax({
			type: 'GET',
			url: _APP.approot + 'rest/declaration/concquestions',
			dataType: 'html',
			data: {
				concentration_id: $('#concentration-id').val(),
				degree_id: $('#degree-id').val(),
				track_id: $('#track-id').val(),
				declaration_id: $('#_id').val(),
				is_editable: DECLARATIONS_APP.editable,
				force_update: DECLARATIONS_APP.update_triggered
			},
			cache: false,
			success: function(d){
				$('#declaration-section-concspecific').html(d) ;
				$('.wysiwyg-additional-questions').wysiwyg(DECLARATIONS_APP.wysiwyg_declarations_config) ;
				
				// Update the program definition. 
				$.ajax({
					type: 'GET',
					url: _APP.approot + 'rest/declaration/programdef',
					dataType: 'json',
					cache: false,
					data:{
						concentration_id: $('#concentration-id').val(),
						degree_id: $('#degree-id').val(),
						track_id: $('#track-id').val(),
						term_id: (conc_changed || track_changed || degree_changed) ? null : $('#term-id').val() 
					},
					success: function(d){
						if( d.title != null ) {
							$.ajax({
								type: 'POST',
								url: _APP.approot + 'rest/programs/creditsmap',
								data: {program_definition_json: encodeURIComponent( JSON.stringify( d.program_definition.requirement_definitions ))},
								dataType: 'json',
								async: false,
								success: function(data){
									PROGRAM_DEFINITION.requirement_credits_map = data ;
								}
							});
						} else {
							PROGRAM_DEFINITION.requirement_credits_map = null ;
						}
							
						
						
						PROGRAM_DEFINITION.saved_program_definition = d.program_definition ;
						PROGRAM_DEFINITION.requires_validation = d.requires_validation ;
						DECLARATIONS_APP.update_plan_toggle();
						DECLARATIONS_APP.update_program_plan_narrative( d.title, d.narrative ) ;
					}
					
				});
			}
		}) ;

		DECLARATIONS_APP.refresh_engaged_scholars_form() ;


		$('#declaration-degree-info').html(
				'While you may change your degree selection at any time, doing so will cause ' +
				'you to lose any concentration-specific data you have set in the remainder of ' +
				'the declaration. If you elect to change your degree selection, the rest of the ' +
				'form will be disabled. It will be re-enabled when you make your new selection.'
		) ;
		$('#degree-selection-link').html('Edit Degree Selection') ;
		$('.degree-menu-set').hide() ;
		$('.degree-menu-selection').show() ;
		$('.degree-menu-info.locked').hide() ;

		if( $.trim($('#welcome-message').html()).length > 0) {
			$('#welcome-message-link').show() ;
		}

		if( (conc_changed || track_changed) && $.trim($('#welcome-message').html()).length && DECLARATIONS_APP.welcome_viewed == false ) {
			DECLARATIONS_APP.show_welcome() ;
		}

		DECLARATIONS_APP.set_declaration_body_state('edit') ;
	}
};

DECLARATIONS_APP.edit_course = function(event, course) {
	var i, course_attributes, course_option_value;
	if( typeof course !== "undefined" ) {
		// Copy the data. Note that we have dependent menus here, so we may need to
		// make multiple synchronous AJAX calls to be sure everything gets populated
		// in the right sequence.

		$('#edit-course-dialog').data('course',course) ;
		course_attributes = $.parseJSON( course.course_attributes_responses_json ) ;

		// check that the course's term is present in the menu
		$('#course-term option.temp-term').remove() ;
		if( $('#course-term option[value="'+course.term_id+'"]').length == 0 ) {
			$('<option value="'+course.term_id+'" class="temp-term">'+_APP.friendly_term(course.term_id,true)+'</option>').prependTo('#course-term') ;
		}

		if( course.from_history == 1 ) {
			course_option_value = course.subject_code+':'+course.course_number+':' ;
			course_option_value += course.sequence_number == null ? '' : course.sequence_number ;
			course_option_value += ':'+course.term_id ;
			
			$('#course-source').val('select-course') ;
			$('#academic-history-menu').val(course_option_value) ;
			$('#edit-course-dialog .course-summary').data('course',course) ;
			
			$('.course-summary .history-institution').html(course.institution) ;
			$('.course-summary .history-subject-code').html(course.subject_code) ;
			$('.course-summary .history-course-number').html(course.course_number) ;
			$('.course-summary .history-course-title').html(course.course_title) ;
			$('.course-summary .history-term').html(_APP.friendly_term(course.term_id)) ;
			
		} else {
			$('#course-source').val('manual-course') ;
			if( course.is_brown == 1 ) {
				$('#institution-select').val('brown') ;
				$('#course-subject').val(course.subject_code) ;
				DECLARATIONS_APP.update_courses_menu(course.subject_code) ;
	//			$('#course-number-select').val(course.subject_code+course.course_number) ;

				// First check for a single match on the subject_code+course_number, ignoring the -# suffix
				// we add on the server to ensure uniqueness. If we find a single match, then we're good.
				// If we find multiple matches, then fall back on a test using the course_number+course_title.

				if( $('#course-number-select option[value|="' + course.subject_code + course.course_number + '"]').length == 1 ) {
					$('#course-not-found').hide() ;
					$('#course-number-select option[value|="' + course.subject_code + course.course_number + '"]').prop('selected','selected') ;
				} else {
					if( $('#course-number-select option:contains("[' + course.course_number + '] '+course.course_title+'")').length > 0 ) {
						$('#course-not-found').hide() ;
						$('#course-number-select option:contains("[' + course.course_number + '] '+course.course_title+'")').prop('selected','selected') ;
					} else {
						$('#course-not-found').html(
								'<p>Unable to find a match for the previously selected course <strong>"' +
								course.subject_code + course.course_number + ': ' + course.course_title +
								'</strong>". This may simply be the result of a title change.</p> <p>Check the list of courses below and re-select the appropriate course.</p>'
						) ;
						$('#course-not-found').show() ;
					}
				}

			} else {
				$('#institution-select').val('non-brown') ;
				$('#institution-name').val(course.institution) ;
				$('#course-number-text').val(course.course_number) ;
				$('#course-title').val(course.course_title) ;
			}			
		}

			
		DECLARATIONS_APP.update_for_selection_method() ;

		$('#course-term').val(course.term_id) ;
		$('#course-comments').val(course.comments) ;

		if( course_attributes.length > 0 ) {
			for( i = 0; i < course_attributes.length; i++ ) {
				if( course_attributes[i].type == 'dropdown') {
					$('#attribute-'+course_attributes[i].id).val(course_attributes[i].value) ;
				} else {
					if( course_attributes[i].value == 1 ) {
						$('#attribute-'+course_attributes[i].id).prop('checked',true) ;
					} else {
						$('#attribute-'+course_attributes[i].id).prop('checked',false) ;
					}
				}
			}
		}
	} else {
		DECLARATIONS_APP.reset_course_modal() ;
		$('#edit-course-dialog').data('course', null) ;

	}

	$('#edit-course-dialog').dialog('open') ;
	return false ;
};

DECLARATIONS_APP.save_course = function() {
	var i, course_attribute, course_summary;
	var err_msg = '';
	var course = $.extend({},$(this).data('course'));
	var course_id_arr = [];

	var course_attributes_template = $('#courseplan').data('course_attributes_template');
	if( $.isEmptyObject(course)) {
		course = {} ;
		// this is a new course, so we'll need to create an id along with populating the rest of the data
		course.id = $('#courseplan tr').length * -1 ;
	}
	course.term_id = $('#course-term').val() ;
	course.sequence_number = null ;
	course.from_history = 0 ;
	course.comments = $('#course-comments').val() ;
	
	if( $('#course-source').val() == 'select-course') {
		course_summary = $('#edit-course-form .course-summary').data('course') ;
		course.is_brown = course_summary.is_brown ;
		course.term_id = course_summary.term_id ;
		course.institution = course_summary.institution ;
		course.subject_code = course_summary.subject_code ;
		course.course_number = course_summary.course_number ;
		course.course_title = course_summary.course_title ;
		course.sequence_number = course_summary.sequence_number ;
		course.from_history = 1 ;
	} else {
		if( $('#institution-select').val() == 'brown' ) {
			course.is_brown = 1 ;
			course.institution = 'Brown' ;
			course.subject_code = $('#course-subject').val() ;
			if( course.subject_code == null || course.subject_code == '' ) {
				err_msg += "- Invalid/no subject selected.\n" ;
			}

			course_id_arr = $('#course-number-select option:selected').html().match(/\[(.*?)\] ?(.*)\t\(?(.*)\)/) ;

			if( course_id_arr !== null && course_id_arr.length > 0 ) {
				course.course_number = course_id_arr[1] ;
				course.course_title = course_id_arr[2] ;
				course.potential_credits = $('#course-number-select').val().match(/(.*?)-(.*?)-(.*?)/)[2];
			} else {
				err_msg += "- Invalid/no course selected.\n" ;
			}


		} else {
			course.is_brown = 0 ;
			course.institution = $('#institution-name').val() ;
			course.subject_code = null ;
			course.course_number = $('#course-number-text').val() ;
			course.course_title = $('#course-title').val() ;
		}
	}
	
		

	if( course.institution == null || course.institution == '' ) {
		err_msg += "- Institution is required.\n" ;
	}
	if( course.course_number == null || course.course_number == '' ) {
		err_msg += "- Invalid/empty course number.\n" ;
	}
	if( course.course_title == null || course.course_title == '' ) {
		err_msg += "- Invalid/empty course title.\n" ;
	}

	// course_attributes...
	course.course_attributes_responses = [] ;
	if( course_attributes_template !== null && course_attributes_template.length > 0 ) {
		for(i = 0; i < course_attributes_template.length; i++ ) {
			course_attribute = course_attributes_template[i] ;

			if( $('#attribute-'+course_attribute.id).attr('type') == 'checkbox' ) {
				course_attribute.value = $('#attribute-'+course_attribute.id).is(':checked') ;

			} else {
				course_attribute.value = $('#attribute-'+course_attribute.id).val() ;
			}


			course.course_attributes_responses.push(course_attribute) ;
		}
	}
	course.course_attributes_responses_json = JSON.stringify(course.course_attributes_responses) ;
	
	if( err_msg == '' ) {
		// look for a match in the student's academic history
		$.ajax({
			type: 'GET',
			async: false,
			url: _APP.approot + 'rest/declaration/historymatch',
			data: {
				subject_code: course.subject_code, 
				course_number: course.course_number,
				course_title: course.course_title,
				term_id: course.term_id,
				institution: course.institution,
				sequence_number: course.sequence_number
			},
			dataType: 'json',
			success: function(data) {
				if( data.course !== null ) {
					course.banner_credits = data.course.banner_credits ;
					course.banner_grade = data.course.banner_grade ;
					course.banner_grade_mode = data.course.banner_grade_mode ;
					course.banner_is_ap = data.course.banner_is_ap ;
					course.potential_credits = data.course.potential_credits ;
					course.banner_match_partial = null ;
					course.is_complete = data.course.is_complete ;
				}
			}
		});
		// get course overlap data
		$.ajax({
			type: 'GET',
			async: false,
			url: _APP.approot + 'rest/declaration/overlaps',
			data: {
				declaration_id: $('#_id').val(),
				subject_code: course.subject_code, 
				course_number: course.course_number,
				sequence_number: course.sequence_number,
				is_brown: course.is_brown
			},
			dataType: 'json',
			success: function(overlaps) {
				course.overlaps = overlaps ;
			}
		});
		
		
		DECLARATIONS_APP.update_course_plan(course) ;
		$(this).dialog('close') ;
		if( $('#substitutions-confirmation').is(':visible') ) {
			$('#substitutions-confirmation').dialog('close').remove() ;
			$('#save').click();
		}
	} else {
		alert("Could not save course due to the following problems: \n\n" + err_msg) ;
	}
};


DECLARATIONS_APP.update_program_plan_courses = function(){
	$('#course-plan-container').empty();
	// loop over the course plan and copy everything into the modal container
	$('#sortableTable tr').each(function(){
		var course_data = $(this).data('course');
		course = DECLARATIONS_APP.render_course( course_data, 'no-icons' ) ;
		if( course !== null ) {
			course.appendTo('#course-plan-container');
		}			
	});
	DECLARATIONS_APP.indicate_courses_in_program();
	DECLARATIONS_APP.sort_courses($('#course-plan-container'));
	DECLARATIONS_APP.init_program_plan_draggable( $('#course-plan-container')) ;
};

// handles turning editability on & off as appropriate for the main declaration form
DECLARATIONS_APP.set_declaration_body_state = function(state) {
	if( state == 'edit' ) {
		$('.declaration-body a').off('click') ;
		$('.declaration-body').find('input,select,textarea').prop('disabled', false) ;
		$('.wysiwyg').show() ;
		$('.wysiwyg-read-only').remove() ;
		$('#edit-course-dialog').dialog('enable') ;
		$('.add-course').show() ;
		$('.add-course').on('click', DECLARATIONS_APP.edit_course ) ;
	} else {
		$('.declaration-body').find('input,select,textarea').prop('disabled', true) ;
		$('.declaration-body a').on('click',function(){
			return false ;
		}) ;
		$('.wysiwyg').hide() ;
		$('.wysiwyg-declarations').each(function(){
			var read_only = $('<div class="wysiwyg-read-only"></div>');
			read_only.append($(this).wysiwyg('getContent')) ;
			read_only.appendTo( $(this).parent()) ;
		}) ;
		$('#edit-course-dialog').dialog('disable') ;
		$('.add-course').hide() ;
		$('.add-course').off('click') ;
	}
};

DECLARATIONS_APP.save_comment = function() {
	var dialog = $(this);
	var comment_id = $(this).find('input[name="id"]').val() ;
	var section_abbrev = $(this).find('input[name="section_abbrev"]').val() ;
	$.ajax({
		type: 'POST',
		url: _APP.approot + 'rest/comments/save',
		data: $(this).find('form').serialize(),
		success: function(data) {
			if( data.error == null ) {
				if( comment_id == -1 ) {
					$(data.comment_html).appendTo($('.declaration-comments.' + section_abbrev));
				} else {
					$('.declaration-comment-container[data-id="'+comment_id+'"]').replaceWith(data.comment_html) ;
				}
			} else {
				alert( data.error ) ;
			}
			dialog.dialog('close');
			if( $('#substitutions-confirmation').is(':visible') ) {
				$('#substitutions-confirmation').dialog('close').remove() ;
				DECLARATIONS_APP.save_declaration('user') ;
			}
		},
		dataType: 'json'
	});

};

DECLARATIONS_APP.find_requirement = function() {
	var declaration_course_id = $(this).val() ;
	if( ! declaration_course_id ) {
		return ;
	}

	var requirement_item = $('.course-id-' + declaration_course_id).parents('.requirement-item') ;
	var requirement = requirement_item.data('requirement') ;
	if( typeof requirement !== 'undefined' ) {
		$('#requirement-uuid').val(requirement.requirement_uuid) ;
	} else {
		$('#requirement-uuid').val('') ;
	}
};

DECLARATIONS_APP.advisor_comment_exists = function(course, requirement) {
	/**
	 * Cases for comments:
	 * - Current comment exists (matches on declaration course id and substitution course)
	 * - Historical comment exists and is used for same substitution (matches on course code and substitution course)
	 * - Historical comment exists, used for another substitution
	 */
	var course_code = course.subject_code + ' ' + course.course_number ;
	var substitution = requirement.subject_code + ' ' + requirement.course_number ;
	var comments = $('.declaration-comment-container').filter(function() {
		var dec_course_match = ($(this).data('declarationCourseId') == course.id) ;
		var course_match = ($(this).find('.comment-course-badge').text().trim() == course_code) ;
		var requirement_match = ($(this).data('requirementUuid') == requirement.requirement_uuid) ;
		var non_empty_comment = ($(this).find('.declaration-comment-text').text().trim().length > 0) ;
		return (dec_course_match || course_match) && requirement_match && non_empty_comment;
	}) ;
	
	return comments.length > 0;
};

DECLARATIONS_APP.confirm_substitutions = function(program_plan) {
	/*
	 * Each array should consist of a set of objects structured as follows:
	 * {
	 *		container: , // titles from the section down to the requirement
	 *		expected_course: , // For explicit requirements this will be the subject + course num + title. For narrative requirements, it will be the narrative.
	 *		current_course: // the subject + course num + title of the substitution course
	 * }
	 */
	var dialog_html = '';
	var substitutions = {
		narrative: [],
		substitutions: [],
		title_diffs: [],
		comments_required: false
	};
	
	var render_substitution = function(substitution) {
		var html = '' ;
		html += '<div class="substitution-container">' + substitution.container + '</div>' ;
		html += '<div class="substitution-expected">' + substitution.expected_course + '</div>' ;
		html += '<div class="substitution-current">' + substitution.current_course + '</div>' ;
		if( substitution.comment_required ) {
			html += '<div class="substitution-comment-required">A comment is required to justify this substitution. ' ;
			html += '<a data-section-abbrev="course-plan" data-declaration-course-id="' + substitution.id + '" ' ;
			html += 'data-requirement-uuid="' + substitution.requirement_uuid + '" ' ;
			html += 'class="edit-comment">Add comment</a></div>' ;
		}
		
		return html ;
	};
	
	$.each( program_plan, function(index, item){
		var sub_course, requirement_element, requirement, container_str ;
		var substitution = {
			container: null,
			expected_course: null,
			current_course: null,
			comment_required: false,
			id: null
		} ;
		if( item.is_substitution ) {
			
			sub_course = $('#dec_course_'+item.declarationcourse_id).data('course') ;
			substitution.id = sub_course.id ;
			substitution.current_course = sub_course.subject_code + ' ' + sub_course.course_number + ' ' + sub_course.course_title ;
			substitution.requirement_uuid = item.requirement_uuid ;
			
			requirement_element = $('#'+item.requirement_uuid) ;
			requirement = requirement_element.data('requirement') ;
			
			// build the container description here...
			container_str = '' ;
			requirement_element.parents('.program-block').each(function(){
				var my_title = $(this).find('.program-block-title').html() ;
				container_str = my_title + ' > ' + container_str ;
			});
			substitution.container = container_str.slice(0,-3) ;
			
			if( requirement.type == 'single-explicit') {
				substitution.expected_course = requirement.subject_code + ' ' + requirement.course_number + ' ' + requirement.course_title ;
				
				if( requirement.subject_code == sub_course.subject_code && requirement.course_number == sub_course.course_number ) {
					if( requirement.comment_required && !requirement.ignore_title_mismatch) {
						var comment_exists = DECLARATIONS_APP.advisor_comment_exists(sub_course, requirement) ;
						substitution.comment_required = !comment_exists ;
						substitutions.comments_required = substitutions.comments_required || substitution.comment_required ;
					}
					substitutions.title_diffs.push(substitution) ;
				} else {
					if( requirement.comment_required ) {
						var comment_exists = DECLARATIONS_APP.advisor_comment_exists(sub_course, requirement) ;
						substitution.comment_required = !comment_exists ;
						substitutions.comments_required = substitutions.comments_required || substitution.comment_required ;
					}
					substitutions.substitutions.push(substitution) ;
				}
				
			} else {
				if( requirement.comment_required ) {
					var comment_exists = DECLARATIONS_APP.advisor_comment_exists(sub_course, requirement) ;
					substitution.comment_required = !comment_exists;
					substitutions.comments_required = substitutions.comments_required || substitution.comment_required;
				}
				substitution.expected_course = requirement.narrative ;
				substitutions.narrative.push(substitution) ;
			}
		}		
	}) ;
	
	dialog_html += '<div class="substitution-info">' + 
			'Approving this declaration will approve all substitutions and course selections \n\
			in the program, listed below. Are you sure you want to do this?' + 
			'</div>' ;
	
	// render the object/array structure into the dialog.
	if( substitutions.substitutions.length > 0 ) {
		dialog_html += '<h3>Substitutions</h3>' ;
		$.each(substitutions.substitutions,function(index,item){
			dialog_html += render_substitution(item) ;
		});
	}
	if( substitutions.narrative.length > 0 ) {
		dialog_html += '<h3>Other Course Selections</h3>' ;
		$.each(substitutions.narrative,function(index,item){
			dialog_html += render_substitution(item) ;
		});
	}
	if( substitutions.title_diffs.length > 0 ) {
		dialog_html += '<h3>Course Title Differences</h3>' ;
		$.each(substitutions.title_diffs,function(index,item){
			dialog_html += render_substitution(item) ;
		});
	}
	var buttons;
	if( substitutions.comments_required ) {
		dialog_html += '<p>Comments are required for the specified courses before \
				you can approve this declaration. Add comments using the \
				"Add Comment" links above or the "New Comment" button under \
				the course/program plan on the main page.</p>' ;
		buttons = {
			'Close': function(){
				$(this).dialog('close').remove() ;
			}
		};
	} else {
		buttons = {
			'Cancel': function(){
				$(this).dialog('close').remove() ;
			},
			'Accept Substitutions': function(){
				var form = $('#declaration-form') ;
				_APP.blockInterface() ;
				$('<input type="hidden" name="save" value="Save" />').appendTo(form) ;
				form.submit() ;
				$(this).dialog('close').remove() ;
			}
		};
	}
	
	$('<div id="substitutions-confirmation" title="Substitutions in program">'+dialog_html+'</div>').dialog({
		autoOpen: true,
		modal: true,
		minWidth: 500,
		'buttons': buttons,
	});
	
};

DECLARATIONS_APP.verify_substitution_comments = function(program_plan) {
	var dialog_html = '';
	var substitutions = [];
	
	var render_substitution = function(substitution) {
		var html = '' ;
		html += '<div class="substitution-container">' + substitution.container + '</div>' ;
		html += '<div class="substitution-expected">' + substitution.expected_course + '</div>' ;
		html += '<div class="substitution-current">' + substitution.current_course + '</div>' ;
		html += '<div class="substitution-comment-required">A comment is required to justify this substitution. ' ;
		html += '<a data-section-abbrev="course-plan" data-declaration-course-id="' + substitution.id + '" class="edit-substitution-course">Add comment</a></div>' ;
		
		return html ;
	};
	
	$.each(program_plan, function(index, item) {
		var sub_course, requirement_element, requirement, container_str, title_mismatch ;
		var substitution = {
			container: null,
			expected_course: null,
			current_course: null,
			id: null
		} ;
		
		if( item.is_substitution ) {
			sub_course = $('#dec_course_'+item.declarationcourse_id).data('course') ;
			substitution.id = sub_course.id ;
			substitution.current_course = sub_course.subject_code + ' ' + sub_course.course_number + ' ' + sub_course.course_title ;

			requirement_element = $('#'+item.requirement_uuid) ;
			requirement = requirement_element.data('requirement') ;
			
			// build the container description here...
			container_str = '' ;
			requirement_element.parents('.program-block').each(function(){
				var my_title = $(this).find('.program-block-title').html() ;
				container_str = my_title + ' > ' + container_str ;
			});
			substitution.container = container_str.slice(0,-3) ;
			
			title_mismatch = false ;
			if( requirement.subject_code === sub_course.subject_code && requirement.course_number === sub_course.course_number ) {
				title_mismatch = true ;
			}
			
			if( requirement.comment_required && !(title_mismatch && requirement.ignore_title_mismatch) ) {
				substitution.expected_course = requirement.subject_code + ' ' + requirement.course_number + ' ' + requirement.course_title ;
				if( requirement.type === 'single-narrative' ) {
					substitution.expected_course = requirement.narrative ;
				}
				if( sub_course.comments.length === 0 ) {
					substitutions.push(substitution);
				}
			}
		}
	});
	
	if( substitutions.length > 0 ) {
		dialog_html += '<div class="substitution-info">' + 
				'Comments are required for the following courses before \
				you can submit this declaration. Add comments using the \
				"Add Comment" links below or the "Edit" buttons on the \
				course/program plan on the main page.' + 
				'</div>' ;

		// render the object/array structure into the dialog.
		dialog_html += '<h3>Substitutions</h3>' ;
		$.each(substitutions, function(index,item) {
			dialog_html += render_substitution(item) ;
		});

		$('<div id="substitutions-confirmation" title="Substitutions in program">'+dialog_html+'</div>').dialog({
			autoOpen: true,
			modal: true,
			minWidth: 500,
			buttons: { 'Close': function(){ $(this).dialog('close').remove() ; } }
		});
		return false;
	} else {
		return true;
	}
};

DECLARATIONS_APP.save_declaration = function(context, substitutions_approved) {
	var substitutions_exist = false ;
	var overlap_counts = [] ;
	var confirm_overlap_overage = false ;
	var declaration_id = $('#_id').val();
	// for the sake of saving a declaration, we set the empty declaration id to our standard '-1'
	if( declaration_id == '' ) {
		declaration_id = -1 ;
	}
	if( typeof substitutions_approved == 'undefined' || substitutions_approved == null ) {
		substitutions_approved = false ;
	}
	
	// We only want to throw this error if the user has clicked on the save button.
	// Auto-saves should just silently bail.
	if( $('#degree-id').val() == '' || $('#concentration-id').val() == '' ) {
		if( context == 'user' ) {
			alert('You must select at least a degree and concentration before continuing') ;
		}
		return false ;
	}

	if( context == 'auto' ) {
		_APP.blockInterface('Auto-saving declaration...') ;
	}

	// compile the course plan into a JSON string
	var course_plan = [];
	$('#sortableTable tr').each(function(){
		var course = $(this).data('course');
		if( typeof course !== 'undefined') {
			course_plan.push( course ) ;
		}
	}) ;

	if( $('#course-plan-json').length == 0 ) {
		$('#declaration-form').append('<input type="hidden" name="course_plan_json" id="course-plan-json" value="" />') ;
	}
	$('#course-plan-json').val( encodeURIComponent( JSON.stringify( course_plan ))) ;
	
	if( $('#program-plan-json').length == 0 ) {
		$('#declaration-form').append('<input type="hidden" name="program_plan_json" id="program-plan-json" value="" />') ;
	}
	var program_plan = [];
	$('#program-plan').find('.requirement-item').each(function(){
		var plan_item = $(this).data('planItem');
		if( typeof plan_item !== 'undefined' && plan_item !== null ) {
			program_plan.push( plan_item ) ;
		}
	});
	$('#program-plan-json').val( encodeURIComponent( JSON.stringify( program_plan ))) ;
	
	if( $('#decision').val() == 'approved' && !substitutions_approved ) {
		// Check whether substitutions exist. If they do then enumerate them for the
		// user and bail until we get confirmation.
		
		$.each(program_plan,function(index,item){
			substitutions_exist = substitutions_exist || item.is_substitution ;
		});
		
		
		if( substitutions_exist ) {
			DECLARATIONS_APP.confirm_substitutions(program_plan) ;
			return false ;
		}
	}
	
	if( context === 'user' && $('#submit-for-review').prop('checked') ) {
		if( ! DECLARATIONS_APP.verify_substitution_comments(program_plan) ) {
			return false;
		}
		
		// check for an overlap count greater than 2 with a single declaration ID
		$('#sortableTable tbody tr').each(function(){
			var course = $(this).data('course') ;
			
			if( course.overlaps.length > 0 ) {
				$.each(course.overlaps,function(index,item){
					if( typeof overlap_counts[item] === 'undefined' ) {
						overlap_counts[item] = 0 ;
					}
					overlap_counts[item]++ ;
					if( overlap_counts[item] > 2 ) {
						confirm_overlap_overage = true ;
					}
				});
			}
		});
		
		if( confirm_overlap_overage ) {
			return confirm(
					'You have more than two courses that overlap with another declaration. '+
					'Many departments do not allow this. Before submitting this declaration for review, '+
					'you should check with both academic advisors to be sure the overlap is okay. ' +
					'If you cancel, you may still save your declaration.\n\n'+
					'Are you sure you want to proceed?'
			) ;
		}
		
		
	}
	
	if( context === 'user' && $('#submit-for-review').prop('checked') && PROGRAM_DEFINITION.requires_validation ) {
		var validation = DECLARATIONS_APP.validate_program_plan() ;
		if( !validation.valid ) {
			var html = "<div><p>You must complete your program plan before you can submit your declaration for review. The following requirements have not been satisfied: \n" ;
			html += "<ul><li>" + validation.errors.join("</li><li>") + "</li></ul></div>" ;
			$('<div id="program-plan-errors-dialog">' + html + '</div>').dialog({
				autoOpen: true,
				modal: true,
				minWidth: 500,
				buttons: {
					'Close': function(){
						$(this).dialog('close').remove() ;
					}
				}
			});
			return false ;
		}
	}
	

	if( context == 'auto' ) {
		// submit the form behind the scenes
		$.ajax({
			type: 'POST',
			url: _APP.approot + 'declarations/view/' + declaration_id,
			data: $('#declaration-form').serialize() + '&auto=1&save=Save',
			dataType: 'json',
			success: function(data,textStatus) {
						// if this is a new declaration that's been auto-saved, update the ID fields
						if( declaration_id == -1 ) {
							$('#_id').val(data.declaration_id); 
							$('#declaration-form').prop('action',$('#declaration-form').prop('action').replace(/-1$/,data.declaration_id));
						}
						// Before refreshing the course plan data, make sure that the
						// course currently being edited has the correct ID.
						var course_being_edited = $('#edit-course-dialog').data('course');
						if( course_being_edited != null && typeof course_being_edited != 'undefined') {
							if( typeof data.course_plan_id_changes[course_being_edited.id] != 'undefined') {
								course_being_edited.id = data.course_plan_id_changes[course_being_edited.id] ;
								$('#edit-course-dialog').data('course', course_being_edited) ;
							}
						}
						DECLARATIONS_APP.refresh_course_plan(false) ;

						setTimeout($.unblockUI, 2000) ;
					},
			error: function(){
				window.location = _APP.approot + 'mydeclarations/list' ;
			}
		}) ;

	}


} ;

DECLARATIONS_APP.render_non_course = function( plan_item, course_variant ){
	var content ;
	var file_info ;
	if( typeof plan_item !== 'undefined' && plan_item !== null ) {
		content = $('<div class="course non-course">\
						<div class="non-course-file"></div>\
					</div>') ;
		if( typeof plan_item.s3asset !== 'undefined' && plan_item.s3asset !== null ) {
			file_info = '<a href="'+_APP.approot+'declarations/viewfile/'+plan_item.id+'" target="_blank">'+plan_item.s3asset.original_filename+'</a>' ;
		} else {
			file_info = '<em>No file uploaded</em>' ;
		}
		content.find('.non-course-file').html(file_info);
		content.data('planItem',plan_item);
	}
	return content ;
};

DECLARATIONS_APP.render_course = function(course_data, variant) {
	var course = null, status_class;
	if( typeof course_data !== 'undefined' && course_data !== null ) {
		if( typeof course_data.delete == 'undefined') {
			course = $('<div class="course">\
						<span class="ui-icon-trash ui-icon-white ui-icon ui-icon-right ui-icon-clickable remove-course"></span>\
						<div class="course-summary">\
							<div class="course-description">\
								<span class="institution"></span>\
								<span class="course-num"></span>\
								<span class="credits"></span>\
								<div class="course-title"></div>\
							</div>\
							<div class="course-status">\
								<div class="dec-course-status"></div>\
								<div class="term"></div>\
								<div class="grade"></div>\
							</div>\
						</div>\
					</div>');
			
			// course.prop('id','course-id-' + course_data.id) ;
			if( course_data.is_brown != 1) {
				course.find('.institution').html(course_data.institution);
			}
			course.find('.course-num').html((course_data.subject_code != null ? course_data.subject_code + ' ' : '') + course_data.course_number);
			if( course_data.banner_credits == null ) {
				course.find('.credits').html(' (<em>'+course_data.potential_credits+'</em>)');
			} else {
				course.find('.credits').html(' ('+course_data.banner_credits+')');
			}

			if( typeof course_data.banner_match_partial == 'undefined' || course_data.banner_match_partial === null ) {
				course.find('.term').html(_APP.friendly_term(course_data.term_id));
			} else {
				course.find('.term').html(_APP.friendly_term(course_data.term_id) + ' (<em>' + _APP.friendly_term(course_data.banner_match_partial.term_id) + '</em>)');
			}
			
			
			if( course_data.banner_grade == null || course_data.banner_grade == '' ) {
				course.find('.grade').html('--');
			} else {
				
				status_class = DECLARATIONS_APP.get_course_status_class(course_data) ;
				course.find('.dec-course-status').html('<span class="course-status-indicator status-'+status_class+'"><span>'+status_class.replace('-',' ')+'</span></span>');
				
				if( course_data.banner_grade.length == 6 ) {
					course.find('.grade').html('<em>' + _APP.friendly_term(course_data.banner_grade) + '</em>') ;
				} else {
					if( course_data.banner_match_partial !== null ) {
						course.find('.grade').html('(<em>' + course_data.banner_grade + '</em>)');
					} else {
						course.find('.grade').html(course_data.banner_grade);
					}
					
				}
				
			}
			
			
			
			
			course.find('.course-title').html(course_data.course_title);
			course.data('course',course_data);
			course.addClass('course-id-'+course_data.id);

			if( variant == 'no-icons' ) {
				course.find('.ui-icon-clickable').hide() ;
			}
		}
	}
	return course ;

};

DECLARATIONS_APP.indicate_courses_in_program = function() {
	$('#course-grid').find('.course').removeClass('in-program') ;
	$('#program-plan-modal').find('.course').each(function(index,element){
		var course_id_class = $(this).prop('class').match(/(course-id--?\d+)\s?.*?$/)[1];
		$('#course-grid').find('.'+course_id_class).addClass('in-program') ;
	});
};

/*
 * Check whether the course selection is valid for the requirement. Note that the
 * only requirement types we care about are "single-narrative" and "single-explicit".
 * Anything "non-course" will just get the default "is valid" object.
 */
DECLARATIONS_APP.validate_course_selection = function(course, requirement) {
	var output = {is_valid: true, is_substitution: false, message: ''};
	
	if( requirement.type == 'single-narrative' ) {
		// let anything through, but add note that it will require approval
		output.is_substitution = true ;
		output.message = 'This course selection must be approved by your advisor.' ;
	} else if( requirement.type == 'single-explicit' ) {
		if( course.banner_is_ap && !requirement.ap_allowed ) {
			output.is_valid = false ;
			output.message = 'AP credit may not count towards this requirement.' ;
		} else {
			if( requirement.substitution_allowed ) {
				// let anything through, but throw a message if anything doesn't match exactly
				if( course.subject_code != requirement.subject_code || course.course_number != requirement.course_number ) {
					output.is_substitution = true;
					output.message = 'The course selected does not match the requirement. Be sure it is a valid selection or substitution.' ;
				} else if( course.course_title != requirement.course_title ) {
					output.message = 'The course title does not match the requirement. Be sure the selected course is correct for the requirement.' ;
					if( ! requirement.ignore_title_mismatch ) {
						output.is_substitution = true;
					}
				}
			} else {
				// subject and code MUST match, mismatched title should throw a message
				output.is_valid = course.subject_code == requirement.subject_code && course.course_number == requirement.course_number;
				if( output.is_valid ) {
					if( course.course_title != requirement.course_title && requirement.ignore_title_mismatch == false) {
						output.is_substitution = true;
						output.message = 'The course title does not match the requirement. Be sure the selected course is correct for the requirement.' ;
					}
				} else {
					output.message = 'The course selected does not match the requirement and the requirement does not allow substitutions.' ;
				}
			}
		}
	}
		
	return output;
};

DECLARATIONS_APP.remove_course_from_program = function(course_id) {
	var course_element = $('.course-id-'+course_id); 
	course_element.closest('.requirement-item').find('.status-indicator').remove() ;
	course_element.closest('.requirement-item').data('planItem',null);
	course_element.closest('.course-plan-course').empty();
};

DECLARATIONS_APP.load_program_plan = function() {
	if( DECLARATIONS_APP.program_plan.length > 0 ) {
		$.each(DECLARATIONS_APP.program_plan,function(index,item){
			var requirement_element = $('#'+item.requirement_uuid);
			var course_data = $('#dec_course_'+item.declarationcourse_id).data('course');
			DECLARATIONS_APP.add_program_item( requirement_element, course_data, item, 'no-icons' );
		});
	}
	DECLARATIONS_APP.update_program_plan_statuses( $('#program-plan'));
	DECLARATIONS_APP.update_credit_counts( '#program-plan' ) ;
};

DECLARATIONS_APP.update_credit_counts = function(program_plan_selector){
	var program_plan_container = $(program_plan_selector);
	var credits_required_min = 0 ;
	var credits_required_max = 0 ;
	var credits_in_plan = 0 ;
	var credits_completed = 0 ;
	var courses_counted = [] ;
	var course_duplications = [] ;
	var ap_credit_used = false ;
	
	program_plan_container.find('.requirement-section').each(function(){
		var section_obj = $(this).data('section') ;
		var section_credits = '' ;
		if( section_obj.credits_count ) {
			credits_required_min += PROGRAM_DEFINITION.requirement_credits_map[ section_obj.requirement_uuid ].min ;
			credits_required_max += PROGRAM_DEFINITION.requirement_credits_map[ section_obj.requirement_uuid ].max ;
			
			section_credits = PROGRAM_DEFINITION.requirement_credits_map[ section_obj.requirement_uuid ].min ;
			if( section_credits != PROGRAM_DEFINITION.requirement_credits_map[ section_obj.requirement_uuid ].max ) {
				section_credits += ' - ' + PROGRAM_DEFINITION.requirement_credits_map[ section_obj.requirement_uuid ].max ;
			}
			section_credits += ' credit' ;
			if( PROGRAM_DEFINITION.requirement_credits_map[ section_obj.requirement_uuid ].max != 1 ) {
				section_credits += 's' ;
			}

			$(this).find('.credits-count').html( section_credits ) ;
		}
	});
	
	program_plan_container.find('.course').each(function(){
		var course = $(this).data('course') ;
		var banner_credits = 0 ;
		var potential_credits ;
		var section_obj = $(this).closest('.requirement-section').data('section') ;
		
		if( section_obj.credits_count ) {
			if( typeof course !== 'undefined' ) {
				if( $.inArray(course.id, courses_counted) == -1 ) {
					courses_counted.push(course.id) ;
					ap_credit_used = ap_credit_used || course.banner_is_ap ;
					if( course.is_complete ) {
						banner_credits = course.banner_credits == null ? 0 : parseFloat(course.banner_credits) ;
					}
					
					potential_credits = typeof course.potential_credits == 'undefined' || course.potential_credits == null ? 1 : parseFloat(course.potential_credits) ;
					credits_in_plan += potential_credits ;
					credits_completed += banner_credits  ;
				} else {
					course_duplications.push(course.subject_code + ' ' + course.course_number) ;
				}
			}
		}
	});
	
	if( credits_required_min == credits_required_max ) {
		$('.credits-summary .credits-required').html(credits_required_min);
	} else {
		$('.credits-summary .credits-required').html(credits_required_min + ' - ' + credits_required_max);
	}
	
	$('.credits-summary .credits-in-plan').html(credits_in_plan);
	$('.credits-summary .credits-completed').html(credits_completed);
	// disabling due to issues resulting from concentrations that have a variable range of required credits
	// $('.credits-summary .credits-remaining').html( (credits_required - credits_in_plan) + " (" + (credits_required - credits_completed) + ")");
	$('.credits-summary .course-duplications').html(course_duplications.join(', ')) ;
	
	if( ap_credit_used ) {
		$('.credits-summary .ap-credit-note').show() ;
	} else {
		$('.credits-summary .ap-credit-note').hide() ;
	}
	
	
};

DECLARATIONS_APP.validate_program_plan = function() {
	var levels = {
		satisfied: 0,
		tentative: 1, // plan complete, credits missing || non-course file exists but declaration is unapproved
		incomplete: 2 // plan incomplete or unapproved courses exist || non-course file does not exist
	} ;
	
	var $program_plan = $('#program-plan').clone(true) ;
	DECLARATIONS_APP.update_program_plan_statuses($program_plan, true) ;
	var incomplete = $program_plan.find('.requirement-section > .section-title .status-indicator').filter(function() {
		return $(this).hasClass(DECLARATIONS_APP.status_icons[levels.incomplete]) ;
	}).parents('.requirement-section') ;
	
	var output = {
		valid: false,
		errors: []
	} ;
	output.valid = incomplete.length === 0;
	if(! output.valid ) {
		DECLARATIONS_APP.descend_requirements(incomplete, function collect_errors() {
			var $status_icon = $(this).find('> .section-title .status-indicator') ;
			if( $status_icon.length === 0 || $status_icon.hasClass(DECLARATIONS_APP.status_icons[levels.incomplete]) ) {
				if ($(this).hasClass('requirement-item')) {
					output.errors.push($(this).data('requirement').title) ;
				} else {
					var requirement = $(this).data('requirement') ;
					if( requirement.type === 'path' ) {
						output.errors.push(requirement.title) ;
					} else {
						output.errors.push(requirement.title) ;
						if( $(this).find('.requirement-group').length > 0 ) {
							DECLARATIONS_APP.descend_requirements($(this), collect_errors) ;
						}
					}
				}
			}
		}) ;
	}
	
	// double-check...if the above didn't find any specific errors, 
	// then the incompletes we initially found must be due to things like 
	// courses requiring advisor approval
	if( output.errors.length == 0 ) {
		output.valid = true ;
	}
	
	$program_plan.remove() ;
	return output ;
} ;

DECLARATIONS_APP.descend_requirements = function(container, cb) {
	container.find('> .nested-requirements > .requirement-item, > .nested-requirements > .requirement-group').each(cb);
} ;

/*
 * Individual courses that are dropped in the program plan should take care of their
 * immediate program item. The function below is intended to handle the parent 
 * containers, whether they're groups, paths or sections. Note that it may need to
 * be called on either the program plan as displayed in the main window or the 
 * editable version in the modal. The correct parent container should be specified, 
 * and DOM elements should be identified using PROGRAM_DEFINITION.matching_uuid().
 * 
 */
DECLARATIONS_APP.update_program_plan_statuses = function(container, ignore_substitutions) {
	ignore_substitutions = ignore_substitutions || false;
	var satisfied_levels = {
		satisfied: 0,
		plan_complete: 1, // plan complete, credits missing || non-course file exists but declaration is unapproved
		plan_incomplete: 2 // plan incomplete or unapproved courses exist || non-course file does not exist
	} ;
	
	container.find('.requirement-section').each(function(){
		var level_id = 0 ;
		var section = $(this).data('section') ;
		DECLARATIONS_APP.update_program_plan_status($(this), ignore_substitutions) ;
		
		$(this).find('> .nested-requirements > .requirement-group, > .nested-requirements > .requirement-item').each(function(){
			var my_level_id = -1;
			var my_status = $(this).data('status') ;
			var my_requirement = $(this).data('requirement') ;
			
			if( typeof my_status == 'undefined') {
				// assume if there's no status that it is not satisfied (use the worst case)
				my_level_id = satisfied_levels.plan_incomplete ;
			} else {
				if( my_status.is_satisfied ) {
					my_level_id = satisfied_levels.satisfied ;
					if( my_status.unapproved_substitutions > 0 && DECLARATIONS_APP.declaration_status != 'approved' && !ignore_substitutions ) {
						my_level_id = satisfied_levels.plan_incomplete ;
					}
				} else {
					my_level_id = satisfied_levels.plan_complete ;
					if( my_requirement.type == 'non-course' ) {
						// no status change required?
					} else {
						if( (my_status.unapproved_substitutions > 0 && DECLARATIONS_APP.declaration_status != 'approved' && !ignore_substitutions) || 
								my_status.potential_credits == null || 
								my_status.potential_credits == '' || 
								my_status.potential_credits < my_status.banner_credits ||
								(my_requirement.type == 'group' && my_status.potential_credits < PROGRAM_DEFINITION.requirement_credits_map[my_requirement.requirement_uuid].min) || 
								!my_status.is_completed
						) {
							my_level_id = satisfied_levels.plan_incomplete ;
						}
					}
				}
			}
			
			level_id = Math.max(level_id, my_level_id) ;
		});
		$('<span class="' + DECLARATIONS_APP.status_icons[level_id] + ' fa fa-lg ui-icon-right status-indicator"></span>').appendTo($(this).find('.section-title:first')) ;
	});
	
};


/*
 * Possible status results are: 
 *	- 0 = satisfied
 *	- 1 = tentatively satisfied
 *	- 2 = not satisfied
 */
DECLARATIONS_APP.update_program_plan_status = function(container, ignore_substitutions) {
	ignore_substitutions = ignore_substitutions || false;
	var status = DECLARATIONS_APP.get_default_program_item_status();
	var status_index = -1;
	var nested_requirements = container.find('.nested-requirements:first > .requirement-item, .nested-requirements:first > .requirement-group');
	
	var satisfied_paths = 0, completed_paths = 0 ;
	var requirement = container.data('requirement') ;
	
	if( nested_requirements.length > 0 ) {
		nested_requirements.each(function(){
			var plan_item, course, nested_status ;
			var my_requirement = $(this).data('requirement');
			if( $(this).hasClass('requirement-group')) {

				nested_status = DECLARATIONS_APP.update_program_plan_status( $(this), ignore_substitutions ) ;
				// credits and unapproved substitutions accumulate...
				status.credits += Math.min( parseFloat( nested_status.credits ), $(this).data('requirement').max_required_credits ) ;
				status.potential_credits += Math.min( parseFloat( nested_status.potential_credits ), $(this).data('requirement').max_required_credits ) ;
				
				status.unapproved_substitutions += parseInt( nested_status.unapproved_substitutions ) ;
				if( nested_status.is_satisfied ) {
					satisfied_paths++ ;
				}
				if( nested_status.is_completed ) {
					completed_paths++ ;
				}
				
			} else {
				plan_item = $(this).data('planItem') ;
				course = $(this).find('.course').data('course') ;
				if( typeof plan_item == 'undefined' ) {
					// nothing?
				} else {
					if( my_requirement.type == 'non-course') {
						// anything to do here?
					} else {
						if( course != null ) {
							if( course.banner_credits != null ) {
								status.potential_credits += parseFloat( course.banner_credits ) ;
							} else if( course.potential_credits != null ) {
								status.potential_credits += parseFloat( course.potential_credits ) ;
							} else if( course.is_brown == 0 ) {
								// we'll give non-brown courses the benefit of the doubt and assume they'll earn one credit
								status.potential_credits += 1 ;
							}

							if( plan_item != null && plan_item.is_satisfied) {
								status.credits += parseFloat( course.banner_credits ) ;
							}
						}
						
						if( plan_item != null ) {
							if( plan_item.is_substitution ) {
								status.unapproved_substitutions++ ;
							}
						}
					}
				}
			}
		});
	}
	if( ignore_substitutions ) {
		status.unapproved_substitutions = 0 ;
	}
	
	// update this container's icon based on the results and requirement definition
	
	if( typeof requirement !== 'undefined' ) {
		status_index = 0 ;
		switch( requirement.type ) {
			case 'group':
				if( status.unapproved_substitutions == 0 || DECLARATIONS_APP.declaration_status == 'approved') {
					if( parseFloat( status.credits ) < parseFloat( requirement.min_required_credits )) {
						status.is_satisfied = false ;
						if( parseFloat( status.potential_credits ) < parseFloat( requirement.min_required_credits )) {
							status.is_completed = false ;
							status_index = 2 ;
						} else {
							status_index = 1 ;
						}
					}
				} else {
					status.is_satisfied = false ;
					status.is_completed = false ;
					status_index = 2 ;
				}
					
				break ;
			case 'path':
				if( parseInt( satisfied_paths ) < parseInt( requirement.min_definitions_to_satisfy )) {
					status.is_satisfied = false ;
					status_index = 1 ;
					if( parseInt( completed_paths ) < parseInt( requirement.min_definitions_to_satisfy )) {
						status.is_completed = false ;
						status_index = 2 ;
					} else {
						status.unapproved_substitutions = 0 ;
					}
				} else {
					status.unapproved_substitutions = 0 ;
				}
				break ;
			default:
				// this is a section-- we deal with that elsewhere
				
		}
	}
	
	container.find('.section-title:first').find('.status-indicator').remove() ;
	if( status_index >= 0 ) {
		$('<span class="' + DECLARATIONS_APP.status_icons[status_index] + ' fa fa-lg ui-icon-right status-indicator"></span>').appendTo(container.find('.section-title:first')) ;
	}
	
	container.data('status',status);
	// return the status object
	return status ;
	
};

DECLARATIONS_APP.add_program_item = function(requirement_element, course_data, plan_item, course_variant){
	var requirement = requirement_element.data('requirement');
	var validation = DECLARATIONS_APP.validate_course_selection(course_data, requirement);
	var status_icon = '' ;
	var status = DECLARATIONS_APP.get_default_program_item_status();
	var plan_item_content ;
	status.is_satisfied = false ;

	if( validation.is_valid ) {
		requirement_element.find('.section-title .status-indicator').remove() ;
		if( validation.message != '' ) {
			$('<span class="ui-icon ui-icon-right ui-icon-alert status-indicator" title="'+validation.message+'"></span>').appendTo(requirement_element.find('.section-title'));
		}
		
		// clear out any course data that might already be present
		requirement_element.find('.course-plan-course').empty();
		
		if( requirement.type == 'non-course') {
			status.potential_credits = 0 ;
			
			if( typeof plan_item !== 'undefined' && plan_item !== null && typeof plan_item.s3asset !== 'undefined' && plan_item.s3asset !== null ) {
				if( DECLARATIONS_APP.declaration_status == 'approved' ) {
					status.is_satisfied = true ;
					status_icon = 'fa-check' ;
				} else {
					status_icon = 'fa-circle' ;
				}
			}
			
			plan_item_content = DECLARATIONS_APP.render_non_course( plan_item, course_variant ) ;
			
		} else {
			if( course_data.is_brown == 1 ) {
				status.potential_credits = course_data.potential_credits ;
			} else {
				status.potential_credits = 1 ;
			}
			if( course_data.is_complete ) {
				status.credits = course_data.banner_credits ;
				if( validation.is_substitution ) {
					if( DECLARATIONS_APP.declaration_status == 'approved' ) {
						status_icon = 'fa-check' ;
						status.is_satisfied = true ;
					} else {
						status.unapproved_substitutions = 1 ;
						status_icon = 'fa-circle-o' ;
					}
				} else {
					status_icon = 'fa-check' ;
					status.is_satisfied = true ;
				}

			} else {
				if( validation.is_substitution ) {
					if( DECLARATIONS_APP.declaration_status == 'approved' ) {
						status_icon = 'fa-circle' ;
					} else {
						status.unapproved_substitutions = 1 ;
						status_icon = 'fa-circle-o' ;	
					}
				} else {
					status_icon = 'fa-circle' ;
				}
			}

			if( typeof plan_item == 'undefined' || plan_item == null ) {
				plan_item = {id: -1};
			}

			plan_item.requirement_uuid = requirement.requirement_uuid;
			plan_item.declarationcourse_id = course_data.id;
			plan_item.is_substitution = validation.is_substitution;
			plan_item.non_course_data = null;
			plan_item.is_satisfied = status.is_satisfied ;
			
			plan_item_content = DECLARATIONS_APP.render_course( course_data, course_variant ) ;
		}

		requirement_element.data('planItem',plan_item);
		requirement_element.data('status',status);

		$('<span class="'+status_icon+' fa fa-lg ui-icon-right status-indicator"></span>').appendTo(requirement_element.find('.section-title')) ;
		plan_item_content.appendTo(requirement_element.find('.course-plan-course')) ;
		
		DECLARATIONS_APP.indicate_courses_in_program();

	} else {
		alert( validation.message ) ;
		return false ;
	}
	return true ;
};


DECLARATIONS_APP.sort_courses = function(container) {
	var courses = container.find('.course').get() ;
	courses.sort(function(a,b){
		return $(a).find('.course-num').text().localeCompare($(b).find('.course-num').text());
	});
	$.each(courses, function(index, item){
		container.append(item);
	}) ;
} ;

DECLARATIONS_APP.init_program_plan_draggable = function(container){
	container.find('.course').draggable({
		helper:function(){
			return $('<div class="course">' + 
					$(this).find('.institution').html() + ' ' +
					$(this).find('.course-num').html() + 
					'</div>' ) ;
		},
		cursorAt: {left:50},
		zindex: 100
	});
};

$(document).ready(function(){
	var show_courses_diff = false;
	var auto_save_interval = 1800000; // 30 minutes
	
	$('span.checkmark-checked').each(function(){
		var img = $('<img src="' + _APP.approot + '../inc/css/images/green_check.png" class="checkmark-checked" aria-label="checked" title="checked" alt="checked" />') ;
		img.prop('id',$(this).prop('id')) ;
		$(this).replaceWith(img) ;
	});
	
	
	
	PROGRAM_DEFINITION.options = {
		sortable: false,
		container_id: '#program-plan',
		editable: false
	};
	
	// page initialization items

	// start the auto-save timer
	if( DECLARATIONS_APP.editable == true ) {
		// auto-save in 30 minutes
		var next_auto_save = new Date( new Date().getTime() + auto_save_interval);

		window.setInterval(function(){
			if( new Date().getTime() > next_auto_save ) {
				if( !$('#save').prop('disabled')) {
					DECLARATIONS_APP.save_declaration('auto') ;
				}
				
				next_auto_save = new Date( new Date().getTime() + auto_save_interval) ;
			}
		}, 60000) ;
	}

	// disable preferred advisors who are not in the available advisors menu
	$('#preferred-advisor-id option').each(function(){
		if( $(this).prop('value') != '' && $('#available-advisors option[value="' + $(this).prop('value') + '"]').length == 0 ) {
			$(this).html( $(this).html() + ' *') ;
			if( $(this).is(':selected')) {
				$('<div class="inactive-advisor"><em>The selected advisor preference is not currently listed as an available advisor for this concentration.</em></div>').appendTo($(this).closest('td')) ;
			}
		}
	});
	
	

	// initialize dialogs
	
	$('#edit-course-dialog')
		.dialog({
			autoOpen: false,
			modal: true,
			minWidth: 500,
			buttons: {
				Save: DECLARATIONS_APP.save_course,
				Cancel: function(){
					$(this).dialog('close');
				}
			},
			close: function() {}
		}) ;
	
	$('#edit-comment')
		.dialog({
			autoOpen: false,
			modal: true,
			minWidth: 500,
			buttons: {
				Save: DECLARATIONS_APP.save_comment,
				Cancel: function(){
					$(this).dialog('close');
				}
			},
			close: function() {}
		}) ;

	$('#welcome-message')
		.dialog({
			autoOpen: false,
			modal: false,
			minWidth: 500,
			buttons: {},
			close: function(){}
		}) ;
		
	$('#override-message')
		.dialog({
			autoOpen: false,
			modal: true,
			minWidth: 500,
			buttons: {},
			close: function(){}
		}) ;

	$('#edit-program-plan-dialog')
		.dialog({
			autoOpen: false,
			closeOnEscape: false,
			modal: true,
			draggable: false,
			buttons: {
				Save: function(){
					var program_visible = $('#program-plan').hasClass('selected');
					$('#program-plan-container').find('.requirement-item').droppable('destroy') ;
					$('#program-plan').replaceWith($('#program-plan-container').clone(true).prop('id','program-plan'));
					$('#program-plan').find('.ui-icon-clickable').not('.toggle-section').hide();
					if( !program_visible ) {
						$('#program-plan').removeClass('selected') ;
					}
					$(this).dialog('close');
				},
				Cancel: function(){
					$(this).dialog('close');
				}
			},
			open: function(){
				var my_container = '#program-plan-container' ;
				$('body').addClass('no-scroll') ;

				$(".ui-dialog-titlebar-close", $(this).parent()).hide();
				
				DECLARATIONS_APP.toggle_program_selector = my_container ;
				$(this).dialog( 'option','width',$(window).width() * .95 );
				$(this).dialog( 'option','height',$(window).height() * .95 );
				$(this).dialog( 'option','position','center') ;
				$(this).find('.main').css({"height": $(window).height() * .8 }) ;
				$(this).find('.requirement-item').droppable({
					accept: '.course',
					activeClass: 'requirement-active',
					hoverClass: 'requirement-hover',
					over: function(event,ui){
						
					},
					drop: function(event, ui){
						var course_data = ui.draggable.data('course');
						var requirement_element = $(this);
						var plan_item = requirement_element.data('planItem');
						var result = DECLARATIONS_APP.add_program_item(requirement_element, course_data, plan_item) ;	
				
						if( result !== false ) {
							DECLARATIONS_APP.update_program_plan_statuses( $( my_container )) ;
							DECLARATIONS_APP.update_credit_counts( my_container );
						}
				
						return result ;
					}
				});
				DECLARATIONS_APP.update_credit_counts('#program-plan-container');
			},
			close: function(){
				$('body').removeClass('no-scroll') ;
				$(".ui-dialog-titlebar-close").show();
				DECLARATIONS_APP.toggle_program_selector = '#program-plan' ;
			}
		}) ;


	/*
	 * If there is no ID in the data as rendered, then we should make the degree selection editable.
	 * Note that this will also initialize the course plan and concentration-specific questions.
	 */
	// If there is no ID in the data as rendered, then we should make the degree
	// selection editable
	if( $('#_id').val() == '' ) {
		$('#welcome-message-link').hide() ;
		DECLARATIONS_APP.set_degree_selection_state('set') ;
	} else {
		DECLARATIONS_APP.set_degree_selection_state('edit') ;
	}

	// add/edit course functions

	$(document).on('click','.add-course',DECLARATIONS_APP.edit_course) ;
	

	$(document).on('click', '.edit-course', function(event){
		DECLARATIONS_APP.edit_course(event, $(this).closest('tr').data('course')) ;
	}) ;
	$(document).on('click', '.edit-substitution-course', function(event){
		DECLARATIONS_APP.edit_course(event, $('#dec_course_' + $(this).data('declarationCourseId')).data('course')) ;
	}) ;
	$(document).on('click', '.drop-course', function() {
		// replace the course data with just the ID and a "delete" flag
		var course = $(this).closest('tr').data('course');
		$(this).closest('tr').data('course',{"id":course.id,"delete":true}) ;

		// mark the row with strikeouts
		$(this).closest('tr').find('td[class!="actions"]').addClass('deleted') ;

		//remove the links
		$(this).parent().html('<em>Dropped</em>') ;

		// remove from program plan
		DECLARATIONS_APP.remove_course_from_program(course.id);

		return false ;
	}) ;

	$(document).on('click', '.course-comments', function() {
		// Show the course comments for the course, or if the comments for this
		// course are already visible, hide them.

		var course = $(this).closest('tr').data('course');
		var current_course = $(this).data('course');

		if( typeof current_course == 'undefined' || course.id != current_course.id ) {
			$(this).data('course',course) ;
			$('#course-comments-tooltip').html(course.comments) ;
			var tipLeft = $(this).position().left - $('#course-comments-tooltip').width() - 4;
			var tipTop = $(this).position().top + $(this).height();

			$('#course-comments-tooltip').css( {"left": tipLeft + "px", "top": tipTop + "px"} ) ;
			$('#course-comments-tooltip').show() ;

		} else {
			$('#course-comments-tooltip').hide() ;
			$(this).data('course',{"id":0}) ; // there should never be a course with id == 0

		}

	}) ;

    $(document).on('click', '.grade-comments', function() {
        var course = $(this).closest('tr').data('course');
        var current_course = $(this).data('course');

        if( typeof current_course == 'undefined' || course.id != current_course.id) {
            $(this).data('course', course) ;
            $('#grade-comments-tooltip').html(course.banner_status) ;
            var tipLeft = $(this).position().left - $('#grade-comments-tooltip').width() - 4;
            var tipTop = $(this).position().top + $(this).height();

            $('#grade-comments-tooltip').css( {"left": tipLeft + "px", "top": tipTop + "px"} ) ;
            $('#grade-comments-tooltip').show() ;
        } else {
            $('#grade-comments-tooltip').hide() ;
            $(this).data('course', {"id":0}) ;
        }
    });

	$(document).on('click','#welcome-message-show', DECLARATIONS_APP.show_welcome) ;

	$(document).on('click','.edit-comment', function(){
		var section_abbrev = $(this).data('sectionAbbrev');
		// populate the form if we're editing a new record and show/hide the courses menu as appropriate.
		$('#course-specific-comment').toggle( section_abbrev == DECLARATIONS_APP.course_plan_section );
		$('#declaration-course-id').prop('disabled','disabled') ;
		if( section_abbrev == DECLARATIONS_APP.course_plan_section ) {
			$('#declaration-course-id').removeProp('disabled') ;
		}
		var container = $(this).closest('.declaration-comment-container');
		$('#section-abbrev').val(section_abbrev) ;
		if( container.length > 0 ) {
			$('#declaration-comment-id').val( container.data('id'));
			$('#visible-to-student').prop('checked', container.data('visibleToStudent') == '1');
			$('#visible-to-other').prop('checked', container.data('visibleToOther') == '1');
			$('#comment-text').val(container.find('.declaration-comment-text').html());
			$('#declaration-course-id').val( container.data('declarationCourseId'));
			$('#requirement-uuid').val(container.data('requirementUuid')) ;
		} else {
			$('#declaration-comment-id').val(-1) ;
			$('#visible-to-student').prop('checked',true) ;
			$('#visible-to-other').prop('checked',true) ;
			$('#comment-text').val('') ;
			$('#declaration-course-id').val($(this).data('declarationCourseId') || '') ;
			$('#requirement-uuid').val($(this).data('requirementUuid') || '') ;
		}

		$('#edit-comment').dialog('open') ;
	}) ;

	$(document).on('change', '#declaration-course-id', DECLARATIONS_APP.find_requirement) ;

	$(document).on('click','.delete-comment', function(){
		var comment_id = $(this).closest('.declaration-comment-container').data('id') ;
		if( confirm('This action cannot be undone. Are you sure you want to do this?')) {
			$.ajax({
				type: 'POST',
				url: _APP.approot + 'rest/comments/delete',
				data: {comment_id: comment_id},
				dataType: 'json',
				success: function(data) {
					if( data.error == null ) {
						$('.declaration-comment-container[data-id="'+comment_id+'"]').remove() ;
					} else {
						alert(data.error) ;
					}
				}
			}) ;
		}
		
	}) ;


	// handle the set/edit degree selection button
	// TODO: add validation to this so that you cannot set the degree unless it has been properly completed.
	$('#degree-selection-link').on('click',function(){
		if( $(this).html() == 'Set Degree Selection' ) {
			DECLARATIONS_APP.set_degree_selection_state('edit') ;
		} else if( $(this).html() == 'Edit Degree Selection' ) {
			DECLARATIONS_APP.set_degree_selection_state('set') ;
		} else {
			$('#override-message').html('An override is required for your current degree selection. Please select another or contact the department for an override.').dialog('open') ;
		}
	}) ;

	// select menu cascades
	$('#concentration-id').on( 'change', function(){
		DECLARATIONS_APP.update_degree_menu($(this).val()) ;
		DECLARATIONS_APP.update_advisor_menu($(this).val(), $('#track-id').val(),false) ;
		DECLARATIONS_APP.verify_override_status($(this).val()) ;
		DECLARATIONS_APP.update_messages($(this).val(), $('#degree-id').val(), $('#track-id').val()) ;
	}) ;

	$('#degree-id').on( 'change', function(){
		DECLARATIONS_APP.update_tracks_menu($('#degree-id').val(), $('#concentration-id').val()) ;
// update_tracks_menu() also triggers update_advisor_menu(), so the following should be redundant
//		DECLARATIONS_APP.update_advisor_menu($('#concentration-id').val(), $('#track-id').val()) ;
	}) ;
	
	$('#track-id').on('change',function(){
		DECLARATIONS_APP.update_messages($('#concentration-id').val(), $('#degree-id').val(), $(this).val()) ;
		DECLARATIONS_APP.update_advisor_menu($('#concentration-id').val(), $('#track-id').val(), true) ;
	});

	$(document).on('change', '#institution-select,#course-source', DECLARATIONS_APP.update_for_selection_method) ;
	$(document).on('change', '#course-subject', function(){
		if( $(this).val() != '' ) {
			DECLARATIONS_APP.update_courses_menu($(this).val()) ;
		}
	}) ;

	$('#save').on('click', function(){
		return DECLARATIONS_APP.save_declaration('user') ;
	}) ;

	$('#decision').on('change', function(){

		if( $(this).val() != 'none' ) {
			$('#row-decision-comments').show() ;
		} else {
			$('#row-decision-comments').hide() ;
		}
	}) ;

	$('#toggle-courses-diff').on('click', function(){
		show_courses_diff = !show_courses_diff ;
		DECLARATIONS_APP.render_course_plan($('#courseplan').data('course_plan'), show_courses_diff) ;
		DECLARATIONS_APP.toggle_program_plan_diff( show_courses_diff ) ;
		$(this).html( show_courses_diff ? 'Hide Changes' : 'Show Changes' ) ;
	}) ;

	// enable "show historical" links where there are available historical comments
	$('.historical').closest('.declaration-comments').find('a.show-historical').show() ;
	$('#approval-responses').find('a.show-historical').show() ;

	$(':not(#approval-responses) .show-historical').on('click',function(){
		$(this).parent().find('.historical').show() ;
		$(this).hide() ;
	}) ;
	$('#approval-responses .show-historical').on('click', function(){
		$(this).parents('tbody').find('.historical').show() ;
		$(this).parents('tr').remove() ;
	}) ;




	$(document).on('click','a.plan-toggle',function(){
		if( $('a.plan-toggle:visible').length > 1 ) {
			$('a.plan-toggle').toggleClass('selected');
			$('.plan-view').toggleClass('selected');
		}			
	});

	$(document).on('click','#edit-program-plan',function(){
		$('#program-plan-modal').empty();
		$('#program-plan').clone(true).prop('id','program-plan-container').addClass('selected').appendTo('#program-plan-modal');
		$('#program-plan-container').find('.ui-icon-clickable').show() ;
		
		DECLARATIONS_APP.update_program_plan_courses() ;
		
		$('#edit-program-plan-dialog').dialog('open') ;
	});

	$(document).on('click','.remove-course',function(){
		DECLARATIONS_APP.remove_course_from_program( $(this).closest('.course').data('course').id) ;
		DECLARATIONS_APP.indicate_courses_in_program();
		DECLARATIONS_APP.update_program_plan_statuses( $( '#program-plan-container' )) ;
		DECLARATIONS_APP.update_credit_counts( '#program-plan-container' );
	});
	
	$(document).on('click','#toggle-courses-in-program',function(){
		var hide_text = 'Hide courses in program plan' ;
		var show_text = 'Show all courses' ;
		var new_text ;
		if( $(this).text() == hide_text) {
			new_text = show_text ;
			$('#course-plan-container .course.in-program').hide();
		} else {
			new_text = hide_text ;
			$('#course-plan-container .course').show();
		}
		
		$(this).html(new_text);
	});

	$(document).on('click','.delete-file',function(){
		var requirement_uuid = $(this).data('requirementUuid') ;
		var view_link = $('a.view-file.'+requirement_uuid) ;
		view_link.replaceWith('<span class="deleted">'+view_link.html()+'</span>') ;
		$('.delete-file.'+requirement_uuid).val('delete') ;
		$(this).closest('span').remove() ;
	});
	
	$(document).on('click','.sift-toggle',function(){
		$('.sift-toggle').toggleClass('sift-on sift-off') ;
		if( $(this).hasClass('sift-on')) {
			DECLARATIONS_APP.winnow_program_plan() ;
		} else {
			DECLARATIONS_APP.unwinnow_program_plan() ;
		}
	});

}) ;