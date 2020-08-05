$(function() {
 

$(window).on("load", function(){
  var checkvalue= window.location.pathname;
  // alert(checkvalue);
  $("a").each(function(){
                       if($(this).attr('href')== checkvalue)
                        { 
                          $(this).parent("li").addClass("active")
                        }
                        });

                   });

                  });