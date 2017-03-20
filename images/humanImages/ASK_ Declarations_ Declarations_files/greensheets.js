var GREEN_SHEETS = {} ;

GREEN_SHEETS.init_green_sheets = function() {
	$('#green-sheets table tr td:last-child').each(function(){
		if( !$(this).is(':visible')) {
			var original_text = $.trim($(this).html()) ; //.replace(/\n/,'<br />') ;
			if( original_text != '' ) {
				$(this).html('<a class="view-note ui-icon-clickable">View</a><div class="note-text">'+original_text+'</div>') ;
			}
		}
		$(this).show() ;
	}) ;
};

$(document).ready(function(){
	// initialize green sheets table behaviors
	GREEN_SHEETS.init_green_sheets() ;
	
	
	$(document).on('click','#green-sheets .view-note',function(){
		$('#green-sheets-note-modal .note-text').html($(this).parent().find('.note-text').html()) ;
		$('#green-sheets-note-modal').dialog('open') ;
	});
	
	$('#green-sheets-note-modal').dialog({
		autoOpen: false,
		modal: true,
		minWidth: 600,
		height: 400,
		buttons: {
			OK: function(){
				$(this).dialog('close') ;
			}
		}
	});
	
});