;(function () {
	
	'use strict';



	var isMobile = {
		Android: function() {
			return navigator.userAgent.match(/Android/i);
		},
			BlackBerry: function() {
			return navigator.userAgent.match(/BlackBerry/i);
		},
			iOS: function() {
			return navigator.userAgent.match(/iPhone|iPad|iPod/i);
		},
			Opera: function() {
			return navigator.userAgent.match(/Opera Mini/i);
		},
			Windows: function() {
			return navigator.userAgent.match(/IEMobile/i);
		},
			any: function() {
			return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
		}
	};

	var fullHeight = function() {

		if ( !isMobile.any() ) {
			$('.js-fullheight').css('height', $(window).height());
			$(window).resize(function(){
				$('.js-fullheight').css('height', $(window).height());
			});
		}

	};


	// Animations
	var contentWayPoint = function() {
		var i = 0;
		$('.animate-box').waypoint( function( direction ) {

			if( direction === 'down' && !$(this.element).hasClass('animated') ) {
				
				i++;

				$(this.element).addClass('item-animate');
				setTimeout(function(){

					$('body .animate-box.item-animate').each(function(k){
						var el = $(this);
						setTimeout( function () {
							var effect = el.data('animate-effect');
							if ( effect === 'fadeIn') {
								el.addClass('fadeIn animated');
							} else if ( effect === 'fadeInLeft') {
								el.addClass('fadeInLeft animated');
							} else if ( effect === 'fadeInRight') {
								el.addClass('fadeInRight animated');
							} else {
								el.addClass('fadeInUp animated');
							}

							el.removeClass('item-animate');
						},  k * 200, 'easeInOutExpo' );
					});
					
				}, 100);
				
			}

		} , { offset: '85%' } );
	};


	var burgerMenu = function() {

		$('.js-colorlib-nav-toggle').on('click', function(event){
			event.preventDefault();
			var $this = $(this);

			if ($('body').hasClass('offcanvas')) {
				$this.removeClass('active');
				$('body').removeClass('offcanvas');	
			} else {
				$this.addClass('active');
				$('body').addClass('offcanvas');	
			}
		});



	};

	// Click outside of offcanvass
	var mobileMenuOutsideClick = function() {

		$(document).click(function (e) {
	    var container = $("#colorlib-aside, .js-colorlib-nav-toggle");
	    if (!container.is(e.target) && container.has(e.target).length === 0) {

	    	if ( $('body').hasClass('offcanvas') ) {

    			$('body').removeClass('offcanvas');
    			$('.js-colorlib-nav-toggle').removeClass('active');
			
	    	}
	    	
	    }
		});

		$(window).scroll(function(){
			if ( $('body').hasClass('offcanvas') ) {

    			$('body').removeClass('offcanvas');
    			$('.js-colorlib-nav-toggle').removeClass('active');
			
	    	}
		});

	};

	var clickMenu = function() {

		$('#navbar a:not([class="external"])').click(function(event){
			var section = $(this).data('nav-section'),
				navbar = $('#navbar');

				if ( $('[data-section="' + section + '"]').length ) {
			    	$('html, body').animate({
			        	scrollTop: $('[data-section="' + section + '"]').offset().top - 55
			    	}, 500);
			   }

		    if ( navbar.is(':visible')) {
		    	navbar.removeClass('in');
		    	navbar.attr('aria-expanded', 'false');
		    	$('.js-colorlib-nav-toggle').removeClass('active');
		    }

		    event.preventDefault();
		    return false;
		});


	};

	// Reflect scrolling in navigation
	var navActive = function(section) {

		var $el = $('#navbar > ul');
		$el.find('li').removeClass('active');
		$el.each(function(){
			$(this).find('a[data-nav-section="'+section+'"]').closest('li').addClass('active');
		});

	};

	var navigationSection = function() {

		var $section = $('section[data-section]');
		
		$section.waypoint(function(direction) {
		  	
		  	if (direction === 'down') {
		    	navActive($(this.element).data('section'));
		  	}
		}, {
	  		offset: '150px'
		});

		$section.waypoint(function(direction) {
		  	if (direction === 'up') {
		    	navActive($(this.element).data('section'));
		  	}
		}, {
		  	offset: function() { return -$(this.element).height() + 155; }
		});

	};






	var sliderMain = function() {
		
	  	$('#colorlib-hero .flexslider').flexslider({
			animation: "fade",
			slideshowSpeed: 5000,
			directionNav: true,
			start: function(){
				setTimeout(function(){
					$('.slider-text').removeClass('animated fadeInUp');
					$('.flex-active-slide').find('.slider-text').addClass('animated fadeInUp');
				}, 500);
			},
			before: function(){
				setTimeout(function(){
					$('.slider-text').removeClass('animated fadeInUp');
					$('.flex-active-slide').find('.slider-text').addClass('animated fadeInUp');
				}, 500);
			}

	  	});

	};

	var themeToggle = function() {

		var root = document.documentElement;
		var storageKey = 'theme';

		var applyTheme = function(theme) {
			root.setAttribute('data-theme', theme);
		};

		var storedTheme = localStorage.getItem(storageKey);
		if (storedTheme === 'dark' || storedTheme === 'light') {
			applyTheme(storedTheme);
		} else {
			applyTheme('light');
		}

		$('#theme-toggle').on('click', function() {
			var current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
			var next = current === 'dark' ? 'light' : 'dark';
			applyTheme(next);
			localStorage.setItem(storageKey, next);
		});

	};

	var contactForm = function() {

		var $form = $('#contact-form');
		if ($form.length === 0) {
			return;
		}

		var recipient = 'surajrao@umd.edu';
		var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		var fields = {
			name: { $input: $('#contact-name'), $error: $('#contact-name-error') },
			email: { $input: $('#contact-email'), $error: $('#contact-email-error') },
			company: { $input: $('#contact-company'), $error: $('#contact-company-error') },
			subject: { $input: $('#contact-subject'), $error: $('#contact-subject-error') },
			message: { $input: $('#contact-message'), $error: $('#contact-message-error') }
		};

		var showError = function(field, message) {
			field.$input.addClass('is-invalid');
			field.$error.text(message).addClass('is-visible');
		};

		var clearError = function(field) {
			field.$input.removeClass('is-invalid');
			field.$error.text('').removeClass('is-visible');
		};

		var validate = function() {
			var isValid = true;

			var name = $.trim(fields.name.$input.val());
			var email = $.trim(fields.email.$input.val());
			var subject = $.trim(fields.subject.$input.val());
			var message = $.trim(fields.message.$input.val());

			if (!name) {
				showError(fields.name, 'Please enter your name.');
				isValid = false;
			} else {
				clearError(fields.name);
			}

			if (!email) {
				showError(fields.email, 'Please enter your email address.');
				isValid = false;
			} else if (!emailPattern.test(email)) {
				showError(fields.email, 'Please enter a valid email address.');
				isValid = false;
			} else {
				clearError(fields.email);
			}

			clearError(fields.company);

			if (!subject) {
				showError(fields.subject, 'Please enter a subject.');
				isValid = false;
			} else {
				clearError(fields.subject);
			}

			if (!message) {
				showError(fields.message, 'Please enter a message.');
				isValid = false;
			} else {
				clearError(fields.message);
			}

			return isValid;
		};

		$.each(fields, function(key, field) {
			field.$input.on('input', function() {
				clearError(field);
			});
		});

		$form.on('submit', function(event) {
			event.preventDefault();

			if (!validate()) {
				return;
			}

			var name = $.trim(fields.name.$input.val());
			var email = $.trim(fields.email.$input.val());
			var company = $.trim(fields.company.$input.val());
			var subject = $.trim(fields.subject.$input.val());
			var message = $.trim(fields.message.$input.val());

			var body = 'Name: ' + name + '\n' +
				'Email: ' + email + '\n' +
				(company ? 'Company: ' + company + '\n' : '') +
				'\n' +
				'Message:\n' + message;

			var mailtoLink = 'mailto:' + recipient +
				'?subject=' + encodeURIComponent(subject) +
				'&body=' + encodeURIComponent(body);

			window.location.href = mailtoLink;
		});

	};

	var projectTapToggle = function() {

		if ( !isMobile.any() ) {
			return;
		}

		$(document).on('touchstart click', '.project', function(e) {
			var $project = $(this);

			if ( $(e.target).closest('a').length ) {
				return;
			}

			if ( !$project.hasClass('active') ) {
				e.preventDefault();
				$('.project').not($project).removeClass('active');
				$project.addClass('active');
			}
		});

		$(document).on('touchstart click', function(e) {
			if ( !$(e.target).closest('.project').length ) {
				$('.project').removeClass('active');
			}
		});

	};

	// Document on load.
	$(function(){
		contactForm();
		themeToggle();
		fullHeight();
		contentWayPoint();
		burgerMenu();

		clickMenu();
		// navActive();
		navigationSection();
		// windowScroll();


		mobileMenuOutsideClick();
		sliderMain();
		projectTapToggle();
	});


}());