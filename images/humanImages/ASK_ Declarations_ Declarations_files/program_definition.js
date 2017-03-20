PROGRAM_DEFINITION = {};

PROGRAM_DEFINITION.options = {
	sortable: true, // true for program editing, false for declarations editing
	container_id: '#requirements',
	editable: true
}; 

PROGRAM_DEFINITION.saved_program_definition = null ;
PROGRAM_DEFINITION.program_validation = null ;
PROGRAM_DEFINITION.requirement_credits_map = null ;
PROGRAM_DEFINITION.parent = null ;

/*
 * Populate display elements for a section and set the data attribute.
 */
PROGRAM_DEFINITION.populate_section = function(section, section_obj) {
	section.find('.section-title-text').html(section_obj.title);
	section.find('.requirement-content.narrative:first').html(section_obj.narrative);
	if( !section_obj.credits_count ) {
		section.find('.requirement-content.credits-count:first').html('<em>Credits do not count towards overall completion.</em>') ;
	}
	section.data('section',section_obj);
};

/*
 * Add a new section to the requirements.
 */
PROGRAM_DEFINITION.add_new_section = function(section_obj) {
	var section = PROGRAM_DEFINITION.get_template('section');
	section.prop('id',section_obj.requirement_uuid);
	section.data('uuid',section_obj.requirement_uuid);
	$(PROGRAM_DEFINITION.options.container_id).append(section);
	if( PROGRAM_DEFINITION.options.sortable && PROGRAM_DEFINITION.options.editable) {
		PROGRAM_DEFINITION.init_sortable();
	}
	PROGRAM_DEFINITION.populate_section(section, section_obj);
};


/*
 * Populate displayable elements for a requirement and set the data attribute.
 */
PROGRAM_DEFINITION.populate_requirement = function(requirement, requirement_obj) {
	var summary_string = '';
	var requirement_content = requirement.children('.requirement-content-container');
	var validation_errors = $('<ul></ul>');
	requirement.children('.section-title').find('.requirement-title').html(requirement_obj.title);
	requirement_content.find('.requirement-content.narrative').html(requirement_obj.narrative);
	requirement_content.find('.requirement-content.footnotes').html(requirement_obj.footnotes);
	
	switch(requirement_obj.type) {
		case 'single-explicit':
//			if( requirement_obj.ignore_title_mismatch ) {
//				summary_string += ' (Ignore title)' ;
//			}
			if( requirement_obj.ap_allowed ) {
				summary_string += ' (AP OK)' ;
			}
			requirement_content.find('.summary').html(summary_string);
			requirement_obj.comment_required = requirement_obj.comment_required || false;
			break;
			
		case 'single-narrative':
			requirement_content.find('.summary').html(requirement_obj.tag_name + ' (' +requirement_obj.required_credits+ ')');
			break;
			
		case 'non-course':
			requirement_content.find('.summary').html('<em>non-course requirement</em>');
			break;
			
		case 'group':
			summary_string = requirement_obj.min_required_credits ;
			if( requirement_obj.min_required_credits != requirement_obj.max_required_credits ) {
				summary_string += ' - ' + requirement_obj.max_required_credits;
			}
			summary_string += ' credit' ;
			if( requirement_obj.max_required_credits > 1 ) {
				summary_string += 's';
			}
			
			requirement_content.find('.summary').html(summary_string);
			break;
			
		case 'path':
			summary_string = requirement_obj.min_definitions_to_satisfy ;
			if( requirement_obj.min_definitions_to_satisfy != requirement_obj.max_definitions_to_satisfy ) {
				summary_string += ' - ' + requirement_obj.max_definitions_to_satisfy;
			}
			summary_string += ' definition' ;
			if( requirement_obj.max_definitions_to_satisfy > 1 ) {
				summary_string += 's';
			}
			
			requirement_content.find('.summary').html(summary_string);
			break;
	};
	
	requirement.find('.section-title').find('.requirement-type-icon').addClass('type-'+requirement_obj.type);

	if( requirement_obj.substitution_allowed || requirement_obj.type != 'single-explicit') {
		requirement.find('.no-substitutions').hide();
	}

	if( PROGRAM_DEFINITION.program_validation != null ) {
		if( typeof PROGRAM_DEFINITION.program_validation.errors[requirement_obj.requirement_uuid] !== 'undefined' ) {
			$.each(PROGRAM_DEFINITION.program_validation.errors[requirement_obj.requirement_uuid]['message'],function(index,item){
				validation_errors.append($('<li>'+item+'</li>')) ;
			});
			requirement_content.find('.validation-error').empty().append(validation_errors);
		}
	}
	
	requirement.data('requirement',requirement_obj);
};

/*
 * Add new requirement to the document.
 */
PROGRAM_DEFINITION.add_new_requirement = function(requirement_obj, container) {
	var requirement;
	if( requirement_obj.type == 'group' || requirement_obj.type == 'path') {
		requirement = PROGRAM_DEFINITION.get_template('group');
	} else {
		requirement = PROGRAM_DEFINITION.get_template('item');
	}
	requirement.prop('id',requirement_obj.requirement_uuid);
	requirement.data('uuid',requirement_obj.requirement_uuid);
	container.append(requirement);
	
	if( PROGRAM_DEFINITION.options.sortable && PROGRAM_DEFINITION.options.editable ) {
		PROGRAM_DEFINITION.init_sortable();
	}
	
	PROGRAM_DEFINITION.populate_requirement(requirement, requirement_obj);
};

/*
 * Pull together all requirements, recursing through the DOM as required to pull in
 * nested requirements.
 */
PROGRAM_DEFINITION.compile_requirements = function(element) {
	var element = $(element);
	var requirement = element.data('requirement');
	if( requirement.type == 'group' || requirement.type == 'path') {
		requirement.requirement_definitions = [];
		element.children('.nested-requirements').children('.requirement-group,.requirement-item').each(
				function(index,child_element){
					requirement.requirement_definitions.push( PROGRAM_DEFINITION.compile_requirements( child_element ) ) ;
				}
		);
	}
	return requirement;
};

/*
 * Add a requirement to the indicated container. If the added requirement contains 
 * nested requirements, loop over them and add as well.
 */
PROGRAM_DEFINITION.add_requirement = function( container_id, requirement_obj ) {
	var container = $('#'+container_id).find('.nested-requirements:first');
	PROGRAM_DEFINITION.add_new_requirement(requirement_obj, container);
	if( (requirement_obj.type == 'path' || requirement_obj.type == 'group') && requirement_obj.requirement_definitions.length > 0 ) {
		$.each( requirement_obj.requirement_definitions, function( child_requirement_index, child_requirement_obj ) {
			PROGRAM_DEFINITION.add_requirement( requirement_obj.requirement_uuid, child_requirement_obj ) ;
		});
	}
};

/*
 * Initialize sorting. Note that this needs to be called any time a new section
 * or requirement is added to refresh the functionality.
 */
PROGRAM_DEFINITION.init_sortable = function() {
	$('.nested-requirements').sortable({
		items: '.requirement-group, .requirement-item'
	});
	$(PROGRAM_DEFINITION.options.container_id).sortable({
		items: '.requirement-section'
	});
};

/*
 * Load a saved program definition into the DOM.
 */
PROGRAM_DEFINITION.load = function(){
	$(PROGRAM_DEFINITION.options.container_id).empty();
	if( PROGRAM_DEFINITION.saved_program_definition !== null && !$.isEmptyObject( PROGRAM_DEFINITION.saved_program_definition )) {
		if( PROGRAM_DEFINITION.saved_program_definition.requirement_definitions.length > 0 ) {
			// loop over the top level sections
			$.each( PROGRAM_DEFINITION.saved_program_definition.requirement_definitions, function(section_index, section_obj) {
				PROGRAM_DEFINITION.add_new_section(section_obj);
				// if a section has nested requirements, loop over and add them to the section
				if( section_obj.requirement_definitions.length > 0 ) {
					$.each( section_obj.requirement_definitions, function( requirement_index, requirement_obj ) {
						PROGRAM_DEFINITION.add_requirement( section_obj.requirement_uuid, requirement_obj ) ;
					});
				}
			});
		}
	}
};

/*
 * Remove all elements from the current program definition container.
 */
PROGRAM_DEFINITION.clear = function() {
	$(PROGRAM_DEFINITION.options.container_id).empty();
};

/*
 * Alternate way to get a DOM element. This should be used when there may be
 * multiple instances of the program plan in a given DOM and the normal use
 * of the id attribute will be problematic.
 */
PROGRAM_DEFINITION.matching_uuid = function(base_set, uuid) {
	return base_set.filter(function(){
		return $(this).data('uuid') && $(this).data('uuid') == uuid ;
	});
};

/*
 * We have slightly different HTML templates for each section, all of which are available
 * via this method. The template types are 'section', 'group' and 'item'. Note that
 * there are more specific types of groups and items, but those are dealt with elsewhere.
 */
PROGRAM_DEFINITION.get_template = function(template_type) {
	var output;
	switch( template_type ) {
		case 'section':
			output = $('<div class="requirement-section program-block section sortable">\
					<div class="section-title">\
						<span class="toggle-section ui-icon ui-icon-triangle-1-s ui-icon-left ui-icon-clickable"></span>\
						<div class="section-title-text program-block-title"></div>\
							<span class="delete-block ui-icon ui-icon-trash ui-icon-right ui-icon-clickable if-editable"></span>\
							<span class="edit-section ui-icon ui-icon-pencil ui-icon-right ui-icon-clickable if-editable"></span>\
							<span class="add-to-section ui-icon ui-icon-plus ui-icon-right ui-icon-clickable if-editable"></span>\
					</div>\
					<div class="requirement-content-container">\
						<div class="requirement-content validation-error"></div>\
						<div class="requirement-content credits-count"></div>\
						<div class="requirement-content narrative"></div>\
					</div>\
					<div class="nested-requirements"></div>\
				</div>');
			break ;
		case 'group':
			output = $('<div class="requirement-group program-block section sortable">\
					<div class="section-title">\
						<span class="toggle-section ui-icon ui-icon-triangle-1-s ui-icon-left ui-icon-clickable"></span>\
						<span class="requirement-type-icon size-24"></span>\
						<div class="requirement-title program-block-title"></div>\
							<span class="delete-block ui-icon ui-icon-trash ui-icon-right ui-icon-clickable if-editable"></span>\
							<span class="edit-requirement ui-icon ui-icon-pencil ui-icon-right ui-icon-clickable if-editable"></span>\
							<span class="add-to-section ui-icon ui-icon-plus ui-icon-right ui-icon-clickable if-editable"></span>\
					</div>\
					<div class="requirement-content-container">\
						<div class="requirement-content validation-error"></div>\
						<div class="requirement-content summary"></div>\
						<div class="requirement-content narrative"></div>\
						<div class="requirement-content footnotes"></div>\
					</div>\
					<div class="nested-requirements"></div>\
				</div>');
			break ;
		case 'item':
			output = $('<div class="requirement-item program-block section">\
					<div class="section-title">\
						<span class="toggle-section ui-icon ui-icon-triangle-1-s ui-icon-left ui-icon-clickable"></span>\
						<span class="requirement-type-icon size-24"></span>\
						<span class="ui-icon ui-icon-left ui-icon-locked no-substitutions"></span>\
						<div class="requirement-title program-block-title"></div>\
						<span class="delete-block ui-icon ui-icon-right ui-icon-clickable ui-icon-trash if-editable"></span>\
						<span class="edit-requirement ui-icon ui-icon-right ui-icon-clickable ui-icon-pencil if-editable"></span>\
					</div>\
					<div class="requirement-content-container">\
						<div class="requirement-content validation-error"></div>\
						<div class="requirement-content summary"></div>\
						<div class="requirement-content narrative"></div>\
						<div class="requirement-content footnotes"></div>\
					</div>\
					<div class="course-plan-course"></div>\
				</div>');
			break ;
		default:
			output = $('<div></div>');
	}
	if( !PROGRAM_DEFINITION.options.editable ) {
		output.find('.if-editable').remove();
	}
	
	
	return output;
};