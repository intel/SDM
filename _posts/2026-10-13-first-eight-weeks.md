---
layout: post
title:  "The first 8 weeks"
categories: status
---

We started this website about eight weeks ago so this is a good time to look at
how the process is going and how the community has responded.  The overall
message that we want you to take away is that the feedback and support has been
great and that, although the specification is not perfect, we will continue to
fix issues that you report, to release and develop more of the specification
and to be as transparent as possible about the process.



## Survey results

Many of you have filled out our [usability survey]({{ site.survey1 }}).
Thank you very much for your feedback.

Later responses (after we fixed some severe website portability issues) found the HTML form much easier
to navigate than the PDF form and had been using Félix Cloutier's excellent website
([https://www.felixcloutier.com/x86/](https://www.felixcloutier.com/x86/))
instead of the PDF for many years.
(We want to say that we are very grateful to Félix for all his work over the years. He has provided an outstanding
service to the community!)
However, others noted that our website contains only part of the content of the PDF and some information such as CPUIDs and Exception tables
were especially problematic.

We were happy to see that the reaction to our [new specification language]({{ site.baseurl }}{% link reading-specs.md %})
was mostly positive with several of you mentioning the clarity of the language.
However, the other big change from the SDM PDF was in the tables and several of you said that the tables were confusing
so we need to rework our ideas of how to convey some fairly complicated information as clearly as possible.

Most significantly, many of you mentioned issues involving smaller screens (e.g., phones), touchscreens (phones, again),
fonts (Linux? Firefox?), terrible contrast in dark mode, etc. We have tried to fix the most significant of these but welcome further feedback.
We are also very interested in accessibility issues: our expertise is in ISA specification and formal verification not in websites or usability and we would welcome any suggestions.

Some of you were bemused by our use of onclick handlers instead of putting every instruction/function on a separate page.
This was a design choice that we copied from the [Intrinsics Guide](https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html)
where we think it worked well but, in the SDM website, it interfered with page scrolling and caching so we have
switched to having a separate page/url for each separate piece of content.
For now, we are sticking with the dynamic in-browser rendering of the website from [databases](https://github.com/intel/SDM/tree/main/data)
because (in the future) that will give us the flexibility to adapt the content and presentation based on user choices, processor models,
etc.

Besides usabality bug reports, we received several requests.
On the usability side, there was a request for fuzzy matching of instruction names, control over sorting options, grouping of instructions, etc.
Also a request for 'hover over' information to explain what notation like "`VEX.L0.66.0F38.WIG DC /r`" means.

If you want to use the website offline, we have added instructions to the [README](https://github.com/intel/SDM/blob/main/README.md)
on using Python's built in webserver on your local machine.

Most of the feedback focused on usability by humans, there were requests for the data in a form more suited to AI
or to generate other formats such as man pages.
The data used to generate the HTML can be found at
[https://github.com/intel/SDM/tree/main/data](https://github.com/intel/SDM/tree/main/data).
This data can be combined with the Intel® X86 Encoder Decoder (Intel® XED) database ([https://intelxed.github.io/](https://intelxed.github.io/))
and the Intel® Intrinsics Guide
([https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html](https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html))
using the "IForm" encoding names to connect them all up.
However, be warned that we have not completely stabilized the data format yet. For example, we may split large files into
many smaller files (to improve load/rendering time and make it easier to understand 'diffs') or we may merge small files
into large files (to support indexing, mouse-overs, etc.) Or we may change fields to make them more flexible or to improve
uniformity across the different kinds of data.
Again, we welcome ideas on how to make the data more usable.

We have also received some queries about the [license](https://github.com/intel/SDM/blob/main/License.md) on the specification
and we are looking at how we can relax the license to enable more uses because [most possible uses of the specification](https://alastairreid.github.io/uses-for-isa-specs/)
are good for our users/customers and, therefore, good for us.

These are all great ideas and, while some of these were already on our list, some such as "man pages" are a complete surprise.


## Bug reports

Besides the [usability bug reports](https://github.com/intel/SDM/issues?q=is%3Aissue+label%3A%22UI+issue%22)
mentioned above, we have also received a lot of bug reports
about [the executable specification](https://github.com/intel/SDM/issues?q=is%3Aissue+label%3A%22Executable+specification+issue%22),
about [the SDM PDF](https://github.com/intel/SDM/issues?q=is%3Aissue+label%3A%22SDM+PDF+issue%22),
and request for [missing content](https://github.com/intel/SDM/issues?q=is%3Aissue+label%3A%22Missing+content%22).

### Bugs in the executable specification

One of the big benefits of an executable specification is that it can be tested using conventional CPU testsuites
and, since the Intel Architecture is over 40 years old, we have a huge number of tests that we could
run on the specification.
Which makes you wonder why we have received over 60 bug reports since the release.

There are a few reasons for this.

1. We cannot currently run all of the tests. For example, many of the 'non-instruction'
   bug reports (e.g., involving memory paging behavior) involve behavior whose
   tests require multiprocessor support.  (This dependency is largely for
   historical reasons: multiprocessor support was added to the architecture
   before a lot of the memory paging behavior so tests naturally assume that
   they can use and need to test multiprocessor features.)

2. We had not fully debugged some parts of the specification.
   For example, floating point architecture has many, many corner cases
   but we prioritized more recent parts of the architecture over fixing
   the bugs that our testsuites detected in the x87 support.

3. We decided to release the specification for feedback before it was finished.
   It would be a lot less embarrassing for us to wait until the specification was
   complete and fully tested before releasing anything but we believe that
   the specification will be a lot more better if we release it in its current
   incomplete, imperfect, unstable state so that you can provide feedback
   that helps us make it more useful to you and, we hope that, it is of
   some use to you even in its current imperfect state.

4. A lot of the bug reports are generated by agentic AI systems that are
   able to generate a lot of (mostly correct) bug reports without needing
   access to our large testsuites.
   Having seen how effective these are (and, also, to spare our blushes),
   we have built an internal agent to generate even more of these bug reports
   and we have been releasing specification fixes as we go.

We are working hard on fixing these bugs although we are also hoping that the
reporting rate slows down a little so that we can get back to filling
gaps in the architecture spec. :-)


### Bugs in the SDM PDF

A few of you have been using the [GitHub issue reporting page](https://github.com/intel/SDM/issues)
to report [bugs in the SDM PDF](https://github.com/intel/SDM/issues?q=is%3Aissue+label%3A%22SDM+PDF+issue%22).
This is not the official way to report these bugs but we recognize that it is
very convenient and transparent so we are trying to figure out how to integrate
bugs reported this way into our usual SDM development flow.
(Unfortunately, we decided this just as some key people went on vacation
so there has not been much activity on these issues so far.)



### Requests for missing content

Besides the requests mentioned above for CPUID information, exception tables, and MSR information,
some of you have noticed that some instruction pages are missing from the website at present.
There are several reasons for this

1. We are not currently rendering pages about instruction prefixes (like `LOCK` and `REP*`)
   because we currently omit pages that don't have any instruction encodings associated with them.

2. Our process for converting the SDM instruction pages from FrameMaker to [DocBook](https://docbook.org/)
   is not perfect and some pages do not convert correctly or have significant formatting issues.

3. Until now, we have only been converting SDM instruction pages from the main instruction pages
   in the SDM (i.e., volume 2, chapters 3-6) and we are missing instruction pages from
   elsewhere in the SDM (e.g., Safer Mode Extensions, Intel® Xeon Phi™, VMX, SEAM, Intel® SGX)
   or other documents such as the ISE (i.e., the Intel® Architecture Instruction Set Extensions and Future Features Programming Reference),
   the Intel® APX extension,
   or the Intel® AVX 10.2 extension.

4. Mechanically generating the instruction encoding tables on every page is complicated
   because there is so much information packed into those tables and a lot of
   informal conventions on how to do this have built up over the years.
   We are still working on generating these tables correctly for some of the instructions.

5. Finally, we don't have specifications for all instructions yet
   or our current specifications contain 'todo' comments that show that it is
   not ready yet.

We are also omitting some of the specifications of 'helper functions' used by the
instructions because

1. Some functions are incomplete or have bugs so including the body of the function
   in documentation would not be helpful.

2. Some functions forms part of the interface between the CPU
   and the rest of the system: the physical memory interface, interrupts, etc.
   The .isa code for these functions just invokes a C/C++ function in our test harness
   which would be unilluminating to show you.
   In most cases we need to improve the documentation of these functions
   so that you know what they do.
   But, in some cases, we need to refactor functions to cleanly separate
   architectural CPU behavior from this interface behavior. This can be hard work.

Our near-term goal is to automatically generate volume 2 of the SDM PDF from
the same data and scripts used to generate the website.
This will improve the accuracy and completeness of the SDM and increase our
confidence in the documentation as well as easing the migration of new
instructions into the SDM.  A pre-requisite of this effort is that we have to
fix all of the above issues in instruction pages and that is our top priority
at the moment.

In the background, we are also working on some of the other missing information:
converting non-instruction chapters to DocBook (which would allow them to be included in the website),
using our internal engineering databases to generate parts of the SDM (both website and PDF), etc.

(Note that we have not decided whether to add 100% of the SDM content to the website.
There are obvious advantages to doing this but many chapters of the SDM are 30--60 pages
long and we don't think that they would work well if just converted into one or more HTML pages.
So our initial focus will be on content that obviously breaks down into small chunks and
that lends itself to generation from databases and high levels of hyperlinking to improve
navigation.)


## Summary

Some of the feedback and responses to our initial release have surprised us.
That is a good thing because it shows us that our decision to release the
specification before it is 'perfect' is the right choice since it
enables you to provide suggestions and ideas that we would not have thought of
by ourselves.
(Also, receiving feedback as you develop something makes it much easier and
much more likely to act on the feedback.)

We are actively trying to finish the specification and extend the website.
Our immediate goal is to be able to generate all the instruction pages that are in the SDM.
We are also working on preparing instructions from the ISE, APX, AVX-10, etc. because
we need to be ready to add those instructions to the SDM as we release products
that include those instructions.

Thank you very much for bearing with us as we figure out how to make this
website as useful and usable as possible.
