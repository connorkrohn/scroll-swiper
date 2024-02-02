// next & prev scroll navigation
const ckSwiperNavigation = (element, direction, event) => {
	const ckSwiper = element.closest(".ckSwiper"),
		cksSlides = ckSwiper.querySelector(".cks-slides"),
		cksSlidesStyle = window.getComputedStyle(cksSlides),
		cksSlidesWidth = cksSlides.getBoundingClientRect().width,
		cksPadding = parseFloat(cksSlidesStyle.getPropertyValue("scroll-margin-top")) || 0,
		cksPaddingFullwidth = parseFloat(cksSlidesStyle.getPropertyValue("padding-left")) || 0,
		cksGap = parseFloat(cksSlidesStyle.getPropertyValue("column-gap")) || 0;
	if (event) {
		ckSwiper.classList.remove("cks-autoplay", "cks-pause");
		ckSwiper.removeEventListener("mouseenter", ckSwiperAutoplayPauseHandler);
		ckSwiper.removeEventListener("mouseleave", ckSwiperAutoplayPauseHandler);
		cksSlides.removeEventListener("scroll", ckSwiperAutoplayStop);
	}
	const cksObserver = new IntersectionObserver(
		(slides, observer) => {
			let scrollByLeft = 0,
				prevIntersectionRatio = 0,
				sumSlidesWidth = 0,
				scrollToFound = false,
				looping = false;
			switch (direction) {
				case "prev":
					if (cksSlides.scrollLeft < 1) {
						looping = true;
						cksSlides.scrollTo({
							left: cksSlides.scrollWidth,
							behavior: "smooth",
						});
						break;
					}
					for (const slide of slides.reverse()) {
						scrollByLeft = slide.boundingClientRect.x - slide.rootBounds.x - cksPadding + 1;
						if (!scrollToFound && prevIntersectionRatio > 0 && slide.intersectionRatio < 0.99) {
							sumSlidesWidth += slide.boundingClientRect.width;
							scrollToFound = true;
						}
						if (scrollToFound) {
							if (sumSlidesWidth + slide.boundingClientRect.width + cksGap - 1 > cksSlidesWidth - cksPaddingFullwidth * 2 + cksPadding) break;
							sumSlidesWidth += slide.boundingClientRect.width + cksGap;
						}
						prevIntersectionRatio = slide.intersectionRatio;
					}
					break;
				case "next":
					if (cksSlides.scrollWidth - cksSlides.scrollLeft - cksSlides.clientWidth < 1) {
						looping = true;
						cksSlides.scrollTo({ left: 0, behavior: "smooth" });
						break;
					}
					for (const slide of slides) {
						if (prevIntersectionRatio > 0 && slide.intersectionRatio < 1) {
							scrollByLeft = slide.boundingClientRect.x - slide.rootBounds.x - cksPadding + 1;
							break;
						}
						prevIntersectionRatio = slide.intersectionRatio;
					}
					break;
			}
			if (!looping) cksSlides.scrollBy({ left: scrollByLeft, behavior: "smooth" });
			observer.disconnect();
		},
		{
			root: ckSwiper,
			rootMargin: "0px -" + (cksPaddingFullwidth - cksPadding) + "px 0px  -" + (cksPaddingFullwidth - cksPadding) + "px",
			threshold: 1.0,
		}
	);
	for (const slides of cksSlides.children) {
		if (window.getComputedStyle(slides).display === "none") continue;
		cksObserver.observe(slides);
	}
};

// observers to enable/disable navigation buttons when appropriate
const ckSwiperButtonObservers = (classname) => {
	for (const ckSwiper of document.querySelectorAll(classname)) {
		const cksSlides = ckSwiper.querySelector(".cks-slides"),
			cksPrevObserver = new IntersectionObserver(
				(slides) => {
					for (const slide of slides) {
						const cksPrevClassList = ckSwiper.querySelector(".cks-prev").classList;
						slide.isIntersecting ? cksPrevClassList.remove("cks-visible") : cksPrevClassList.add("cks-visible");
					}
				},
				{ root: cksSlides, threshold: 0.99 }
			),
			cksNextObserver = new IntersectionObserver(
				(slides) => {
					for (const slide of slides) {
						const cksNextClassList = ckSwiper.querySelector(".cks-next").classList;
						slide.isIntersecting ? cksNextClassList.remove("cks-visible") : cksNextClassList.add("cks-visible");
					}
				},
				{ root: cksSlides, threshold: 0.99 }
			);
		for (const slide of cksSlides.children) {
			if (window.getComputedStyle(slide).display === "none") continue;
			cksPrevObserver.observe(slide);
			break;
		}
		for (const slide of [...cksSlides.children].reverse()) {
			if (window.getComputedStyle(slide).display === "none") continue;
			cksNextObserver.observe(slide);
			break;
		}
	}
};

// autoplay only when not paused, resetting scroll position to 0 after reaching the end.
const ckSwiperAutoplay = () => {
	for (const ckSwiper of document.querySelectorAll(".ckSwiper.cks-autoplay")) {
		const cksNext = ckSwiper.querySelector(".cks-next"),
			cksSlides = ckSwiper.querySelector(".cks-slides");
		if (ckSwiper.classList.contains("cks-pause")) continue;
		cksSlides.removeEventListener("scroll", ckSwiperAutoplayStop);
		cksSlides.addEventListener("scrollend", () => {
				cksSlides.addEventListener("scroll", ckSwiperAutoplayStop, {once: true});
			},
		{ once: true });
		if (cksSlides.scrollWidth - cksSlides.scrollLeft - cksSlides.clientWidth > 1) {
			ckSwiperNavigation(cksNext, "next");
			continue;
		}
		cksSlides.scrollTo({ left: 0, behavior: "smooth" });
	}
};

// Temporarily pause or resume autoplay
const ckSwiperAutoplayPauseHandler = (event) => {
	switch (event.type) {
		case "mouseenter":
			event.target.closest(".ckSwiper").classList.add("cks-pause");
			break;
		case "mouseleave":
			event.target.closest(".ckSwiper").classList.remove("cks-pause");
			break;
	}
};

// Permanently stop autoplay
const ckSwiperAutoplayStop = (event) => {
	const ckSwiper = event.target.closest(".ckSwiper");
	ckSwiper.classList.remove("cks-autoplay", "cks-pause");
	ckSwiper.removeEventListener("mouseenter", ckSwiperAutoplayPauseHandler);
	ckSwiper.removeEventListener("mouseleave", ckSwiperAutoplayPauseHandler);
};

// wait for dom load
document.addEventListener("DOMContentLoaded", (event) => {
	// create interval for autoplay swipers
	if (document.querySelector(".ckSwiper.cks-autoplay")) {
		for (const ckSwiper of document.querySelectorAll(".ckSwiper.cks-autoplay")) {
			ckSwiper.addEventListener("mouseenter", ckSwiperAutoplayPauseHandler);
			ckSwiper.addEventListener("mouseleave", ckSwiperAutoplayPauseHandler);
		}
		setInterval(ckSwiperAutoplay, 5000);
	}

	// only observe swipers when buttons are wanted
	if (window.matchMedia("(any-hover: hover)").matches) {
		ckSwiperButtonObservers(".ckSwiper");
	} else if (document.querySelector(".ckSwiper.cks-mobilebuttons")) {
		ckSwiperButtonObservers(".ckSwiper.cks-mobilebuttons");
	}

	// remove scroll hint after scrolling
	if (document.querySelector(".ckSwiper.cks-scrollhint")) {
		for (const ckSwiper of document.querySelectorAll(".ckSwiper.cks-scrollhint")) {
			ckSwiper.querySelector(".cks-slides").addEventListener("scroll", () => {
					ckSwiper.classList.remove("cks-scrollhint");
				},
			{ once: true });
		}
	}
});