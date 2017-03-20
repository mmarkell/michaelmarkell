(function( $ ) {
	$.fn.searchfilter = function( options ) {

		var settings = $.extend({
			// set to TRUE if you want datetime and timestamp fields to use a full date/time interface instead of just a date field
			'enable_datetime': false
		}, options) ;

		var theForm = this ;

		var zeroPad = function(num) {
			return (num < 10 ? '0' : '' ) + num ;
		};

		var getGeneralType = function(dataType) {
			if( dataType == 'varchar' || dataType == 'char' || dataType == 'text' || dataType == 'longtext' || dataType == 'mediumtext' || dataType == 'shorttext') {
				return 'text' ;
			}

			// only if the config is set to do this
			if( settings.enable_datetime ) {
				if( dataType == 'datetime' || dataType == 'timestamp') {
					return 'datetime' ;
				}
			}

			if(  dataType == 'date' || dataType == 'timestamp' || dataType == 'datetime') {
				return 'date' ;
			}

			if( dataType == 'tinyint' || dataType == 'smallint' || dataType == 'mediumint' || dataType == 'int' || dataType == 'bigint' || dataType == 'float' || dataType == 'double' || dataType == 'decimal' ) {
				return 'numeric' ;
			}
			return 'other' ;
		} ;
		
		var triggerQuickFilter = function(config) {
			// If a boolean operator is specified, set it.
			if( config.operator ) {
				$('select[name="boolean_connector"]').val(config.operator) ;
			}
			var idx = 0;
			for (var field in config.fields) {
				if( config.fields.hasOwnProperty(field) ) {
					var values = config.fields[field] ;
					
					// For each value, find or create a new search group.
					values.forEach(function(value) {
						var row = $('#search-group-' + idx) ;
						if( row.length === 0 ) {
							row = addSearchGroup() ;
						}
						
						// Specify the filter field, and update the display to
						// show the appropriate input fields.
						row.find('[name="filter_column[]"]').val(field) ;
						updateGroup(row) ;
						var inputs = row.find('span:visible').first() ;
						
						// An input name => value mapping is provided.
						if( Object.prototype.toString.call(value) === '[object Object]' ) {
							for (var prop in value) {
								if( value.hasOwnProperty(prop) ) {
									inputs.find('[name="' + prop + '[]"]').val(value[prop]) ;
								}
							}
						
						// A list of input values is provided: fill left to right.
						} else if( Array.isArray(value) ) {
							inputs.find(':input:visible').each(function(i, input) {
								if( i >= value.length ) { return ; }
								$(input).val(value[i]) ;
							}) ;
							
						// A single input value is provided: put it in the first input.
						} else {
							inputs.find(':input:visible').first().val(value) ;
						}
						idx++ ;
					}) ;
				}
			}
			var count = $('div[id|="search-group"]').length ;
			while (idx < count) {
				$('#search-group-' + idx).remove() ;
				idx++ ;
			}
			updateManipulators() ;
			// Uncomment this to have the quick filter buttons automatically
			// submit the new search.
//			$('#set-filter-search').click() ;
		} ;

		var updateGroup = function(container) {
			container.find('.filter_value').hide() ;
			container.find('.filter_value').children().attr('disabled','disabled') ;

			var selected_class = container.find('select[name^="filter_column"]').find('option:selected').attr('class') ;
			if( getGeneralType( selected_class ) == 'date' ) {
				container.find('.filter_date').show() ;
				container.find('.filter_date').removeAttr('disabled') ;
				container.find('.filter_date').children().removeAttr('disabled') ;

			} else if( getGeneralType( selected_class ) == 'text') {
				container.find('.filter_text').show() ;
				container.find('.filter_text').children().removeAttr('disabled') ;

			} else if( getGeneralType( selected_class ) == 'numeric') {
				container.find('.filter_numeric').show() ;
				container.find('.filter_numeric').children().removeAttr('disabled') ;

 			} else if( getGeneralType( selected_class ) == 'datetime') {
 				container.find('.filter_datetime').show() ;
 				container.find('.filter_datetime').removeAttr('disabled') ;
 				container.find('.filter_datetime').children().removeAttr('disabled') ;

			} else {
				container.find('.'+selected_class).show() ;
				container.find('.'+selected_class).children().removeAttr('disabled') ;
			}
		} ;

		var updateManipulators = function() {
			var searchGroups = theForm.find('div[id|="search-group"]') ;
			if( searchGroups.length > 1 ) {
				// show the "remove" buttons and hide all but the last "add" button
				theForm.find('a.remove-search-group').show() ;
				theForm.find('a.add-search-group').hide() ;
				theForm.find('a.add-search-group:last').show() ;
				theForm.find('span.manipulator-placeholder').show() ;
				theForm.find('span.manipulator-placeholder:last').hide() ;
			} else {
				// disable the "remove" buttons and show the "add" button
				theForm.find('a.remove-search-group').hide() ;
				theForm.find('a.add-search-group').show() ;
				theForm.find('span.manipulator-placeholder').hide() ;
			}
			searchGroups.each(function(i, g) {
				$(g).attr('id', 'search-group-' + i) ;
			}) ;
		};

 		var updateDatetimeViaDate = function(dateText, inst) {
			var container = $(this).closest('span.filter_datetime') ;
			var fieldName = $(this).attr('name') ;

			var field_index = fieldName.match(/\d+/)[0] ;
			var date_array = dateText.match(/(\d{2})\/(\d{2})\/(\d{4})/) ;
			var hour = container.find('select[name="datetime_'+field_index+'_hour"]').val() ;
			var minute = container.find('select[name="datetime_'+field_index+'_minute"]').val() ;
			var meridian = container.find('select[name="datetime_'+field_index+'_meridian"]').val() ;

			if( meridian == 'AM') {
				if( hour == 12 ) {
					hour = '00' ;
				}
			} else {
				if( hour < 12 ) {
					hour = parseInt(hour) + 12 ;
				}
			}

			var final_date = date_array[3] + '-' + date_array[1] + '-' + date_array[2] + ' ' + hour + ':' + minute + ':00' ;

 			container.find('input[name="search_val_'+field_index+'[]"]').val(final_date) ;
 		};

		var updateDatetimeViaTime = function( container, fieldName ) {
			var field_index = fieldName.match(/\d+/)[0] ;

			var dateObj = container.find('input[name="datetime_'+field_index+'_date"]').datepicker('getDate') ;
			var dateText = dateObj.getFullYear() + '-' + zeroPad( dateObj.getMonth() + 1 ) + '-' + zeroPad( dateObj.getDate() + 1 ) ;

			var hour = container.find('select[name="datetime_'+field_index+'_hour"]').val() ;
			var minute = container.find('select[name="datetime_'+field_index+'_minute"]').val() ;
			var meridian = container.find('select[name="datetime_'+field_index+'_meridian"]').val() ;

			if( meridian == 'AM') {
				if( hour == 12 ) {
					hour = '00' ;
				}
			} else {
				if( hour < 12 ) {
					hour = parseInt(hour) + 12 ;
				}
			}

			var final_date = dateText + ' ' + hour + ':' + minute + ':00' ;

 			container.find('input[name="search_val_'+field_index+'[]"]').val(final_date) ;
		};
		
		var addSearchGroup = function() {
			var new_group = $('#search-group-0').clone(true) ;
			new_group.attr('id', 'search-group-' + $('div[id|="search-group"]').length) ;
			new_group.find('input').val('') ;
			new_group.appendTo('#search-groups');
			updateGroup(new_group) ;
			updateManipulators() ;

			new_group.find('.datepicker').removeClass('hasDatepicker').datepicker('destroy').attr('id','').datepicker({changeMonth: true,changeYear: true}) ;
			new_group.find('.datepicker-filter').removeClass('hasDatepicker').datepicker('destroy').attr('id','').datepicker({changeMonth: true, changeYear: true, onSelect: updateDatetimeViaDate}) ;
			return new_group;
		};

		$('div[id|="search-group"]').each( function() {
			updateGroup($(this)) ;
		}) ;
		updateManipulators() ;

		theForm.find('select[name^="filter_column"]').change( function(){
			var container = $(this).closest('div[id|="search-group"]') ;
			updateGroup(container) ;
		}) ;

		theForm.find('a.add-search-group').on('click', addSearchGroup) ;
		theForm.find('a.remove-search-group').on('click', function() {
			$(this).closest('div[id|="search-group"]').remove() ;
			updateManipulators() ;
		}) ;

 		theForm.on('change', 'select[name^="datetime_"]', function() {
 			updateDatetimeViaTime( $(this).closest('span.filter_datetime'), $(this).attr('name')) ;
 		}) ;

		$('.datepicker-filter').datepicker({
			changeMonth: true,
			changeYear: true,
 			onSelect: updateDatetimeViaDate
 		}) ;

		$('.quick-filter').click(function() {
			triggerQuickFilter($(this).data('filter-config')) ;
		}) ;
		
		theForm.show() ;

	} ;
})( jQuery ) ;