// next & prev scroll navigation
const scrollSwiperNavigation = (element, direction, event) => {
	const scrollSwiper = element.closest(".scrollSwiper"),
		ssSlides = scrollSwiper.querySelector(".ss-slides"),
		ssSlidesStyle = window.getComputedStyle(ssSlides),
		ssSlidesWidth = ssSlides.getBoundingClientRect().width,
		ssPadding = parseFloat(ssSlidesStyle.getPropertyValue("scroll-margin-top")) || 0,
		ssPaddingFullwidth = parseFloat(ssSlidesStyle.getPropertyValue("padding-left")) || 0,
		ssGap = parseFloat(ssSlidesStyle.getPropertyValue("column-gap")) || 0;
	if (event) {
		scrollSwiper.classList.remove("ss-autoplay", "ss-pause");
		scrollSwiper.removeEventListener("mouseenter", scrollSwiperAutoplayPauseHandler);
		scrollSwiper.removeEventListener("mouseleave", scrollSwiperAutoplayPauseHandler);
		ssSlides.removeEventListener("scroll", scrollSwiperAutoplayStop);
	}
	const ssObserver = new IntersectionObserver(
		(slides, observer) => {
			let scrollByLeft = 0,
				prevIntersectionRatio = 0,
				sumSlidesWidth = 0,
				scrollToFound = false,
				looping = false;
			switch (direction) {
				case "prev":
					if (ssSlides.scrollLeft < 1) {
						looping = true;
						ssSlides.scrollTo({
							left: ssSlides.scrollWidth,
							behavior: "smooth",
						});
						break;
					}
					for (const slide of slides.reverse()) {
						scrollByLeft = slide.boundingClientRect.x - slide.rootBounds.x - ssPadding + 1;
						if (!scrollToFound && prevIntersectionRatio > 0 && slide.intersectionRatio < 0.99) {
							sumSlidesWidth += slide.boundingClientRect.width;
							scrollToFound = true;
						}
						if (scrollToFound) {
							if (sumSlidesWidth + slide.boundingClientRect.width + ssGap - 1 > ssSlidesWidth - ssPaddingFullwidth * 2 + ssPadding) break;
							sumSlidesWidth += slide.boundingClientRect.width + ssGap;
						}
						prevIntersectionRatio = slide.intersectionRatio;
					}
					break;
				case "next":
					if (ssSlides.scrollWidth - ssSlides.scrollLeft - ssSlides.clientWidth < 1) {
						looping = true;
						ssSlides.scrollTo({ left: 0, behavior: "smooth" });
						break;
					}
					for (const slide of slides) {
						if (prevIntersectionRatio > 0 && slide.intersectionRatio < 1) {
							scrollByLeft = slide.boundingClientRect.x - slide.rootBounds.x - ssPadding + 1;
							break;
						}
						prevIntersectionRatio = slide.intersectionRatio;
					}
					break;
			}
			if (!looping) ssSlides.scrollBy({ left: scrollByLeft, behavior: "smooth" });
			observer.disconnect();
		},
		{
			root: scrollSwiper,
			rootMargin: "0px -" + (ssPaddingFullwidth - ssPadding) + "px 0px  -" + (ssPaddingFullwidth - ssPadding) + "px",
			threshold: 1.0,
		}
	);
	for (const slides of ssSlides.children) {
		if (window.getComputedStyle(slides).display === "none") continue;
		ssObserver.observe(slides);
	}
};

// observers to enable/disable navigation buttons when appropriate
const scrollSwiperButtonObservers = (classname) => {
	for (const scrollSwiper of document.querySelectorAll(classname)) {
		const ssSlides = scrollSwiper.querySelector(".ss-slides"),
			ssPrevObserver = new IntersectionObserver(
				(slides) => {
					for (const slide of slides) {
						const ssPrevClassList = scrollSwiper.querySelector(".ss-prev").classList;
						slide.isIntersecting ? ssPrevClassList.remove("ss-visible") : ssPrevClassList.add("ss-visible");
					}
				},
				{ root: ssSlides, threshold: 0.99 }
			),
			ssNextObserver = new IntersectionObserver(
				(slides) => {
					for (const slide of slides) {
						const ssNextClassList = scrollSwiper.querySelector(".ss-next").classList;
						slide.isIntersecting ? ssNextClassList.remove("ss-visible") : ssNextClassList.add("ss-visible");
					}
				},
				{ root: ssSlides, threshold: 0.99 }
			);
		for (const slide of ssSlides.children) {
			if (window.getComputedStyle(slide).display === "none") continue;
			ssPrevObserver.observe(slide);
			break;
		}
		for (const slide of [...ssSlides.children].reverse()) {
			if (window.getComputedStyle(slide).display === "none") continue;
			ssNextObserver.observe(slide);
			break;
		}
	}
};

// autoplay only when not paused, resetting scroll position to 0 after reaching the end.
const scrollSwiperAutoplay = () => {
	for (const scrollSwiper of document.querySelectorAll(".scrollSwiper.ss-autoplay")) {
		const ssNext = scrollSwiper.querySelector(".ss-next"),
			ssSlides = scrollSwiper.querySelector(".ss-slides");
		if (scrollSwiper.classList.contains("ss-pause")) continue;
		ssSlides.removeEventListener("scroll", scrollSwiperAutoplayStop);
		ssSlides.addEventListener("scrollend", () => {
				ssSlides.addEventListener("scroll", scrollSwiperAutoplayStop, {once: true});
			},
		{ once: true });
		if (ssSlides.scrollWidth - ssSlides.scrollLeft - ssSlides.clientWidth > 1) {
			scrollSwiperNavigation(ssNext, "next");
			continue;
		}
		ssSlides.scrollTo({ left: 0, behavior: "smooth" });
	}
};

// Temporarily pause or resume autoplay
const scrollSwiperAutoplayPauseHandler = (event) => {
	switch (event.type) {
		case "mouseenter":
			event.target.closest(".scrollSwiper").classList.add("ss-pause");
			break;
		case "mouseleave":
			event.target.closest(".scrollSwiper").classList.remove("ss-pause");
			break;
	}
};

// Permanently stop autoplay
const scrollSwiperAutoplayStop = (event) => {
	const scrollSwiper = event.target.closest(".scrollSwiper");
	scrollSwiper.classList.remove("ss-autoplay", "ss-pause");
	scrollSwiper.removeEventListener("mouseenter", scrollSwiperAutoplayPauseHandler);
	scrollSwiper.removeEventListener("mouseleave", scrollSwiperAutoplayPauseHandler);
};

// wait for dom load
document.addEventListener("DOMContentLoaded", (event) => {
	// create interval for autoplay swipers
	if (document.querySelector(".scrollSwiper.ss-autoplay")) {
		for (const scrollSwiper of document.querySelectorAll(".scrollSwiper.ss-autoplay")) {
			scrollSwiper.addEventListener("mouseenter", scrollSwiperAutoplayPauseHandler);
			scrollSwiper.addEventListener("mouseleave", scrollSwiperAutoplayPauseHandler);
		}
		setInterval(scrollSwiperAutoplay, 5000);
	}

	// only observe swipers when buttons are wanted
	if (window.matchMedia("(any-hover: hover)").matches) {
		scrollSwiperButtonObservers(".scrollSwiper");
	} else if (document.querySelector(".scrollSwiper.ss-mobilebuttons")) {
		scrollSwiperButtonObservers(".scrollSwiper.ss-mobilebuttons");
	}

	// remove scroll hint after scrolling
	if (document.querySelector(".scrollSwiper.ss-scrollhint")) {
		for (const scrollSwiper of document.querySelectorAll(".scrollSwiper.ss-scrollhint")) {
			let sslides = scrollSwiper.querySelector(".ss-slides");
			// check if overflow is present - remove if not
			if (sslides.scrollWidth <= sslides.clientWidth) return scrollSwiper.classList.remove("ss-scrollhint");
			sslides.addEventListener("scroll", () => {
					scrollSwiper.classList.remove("ss-scrollhint");
				},
			{ once: true });
		}
	}
});