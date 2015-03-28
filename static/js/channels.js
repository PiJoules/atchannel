
$(window).load(function(){
	$(".description").each(function(){
		$(this).html( markdown.toHTML( $(this).html().trim() ) );
	});
});