---
layout: post
title:  "A preview of the future IA documentation"
date:   2026-08-20 12:00:00 +0000
categories: announcement
sticky: true
---

This [website]({{ site.sdm_html }}) contains a preview of how Intel intends to document and present
the Intel® Architecture in the future.
Our goal is a specification that is more accurate and accessible.
We would like to receive feedback on how well we meet this goal before we apply this
approach to the
["SDM" (i.e., the Intel® 64 and IA-32 Architectures Software Development Manual)](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html).
While we hope that you find this useful, the SDM remains the official
description of the Intel&reg; Architecture.

While much of the website is derived from the latest SDM, there are
some important changes

- It is [a webpage](/sdm.html) to promote easier searching and exploration.

  In the future, Intel will use both the website and the existing PDF format
  to describe the architecture.

- The behavior of instructions and helper functions is
  described in a [new specification language]({{ site.baseurl }}{% link reading-specs.md %})
  that enables us to test the specification which makes
  the specification more precise and accurate.

- The instruction encoding tables on each instruction page present some
  information differently and provide some additional information.

We are releasing this preview ahead of making changes to the SDM because
we are keen to hear feedback on these changes.
Is it usable? accessible? bugs in the website? bugs in the specification?
Have we broken anything that you depend on?
Is anything preventing you from using this documentation?
Please fill out this [short usability survey]({{ site.survey1 }})
or file a [GitHub issue]({{ site.public_github }}/issues) about any problems you find.
We are summarizing frequent questions in [frequently asked questions]({{ site.baseurl }}{% link faq.md %}).


## What is in the initial release?

The initial release **includes almost all instructions** documented in the SDM.

The **major omissions** from the release are instructions associated with

- APX (this is not yet included in the SDM)
- FRED
- MPX
- SEAM
- SGX
- SMM
- TSX
- VMX
- x87


## Quality level of this release

We have tested a lot of the specification but we have not tested all of it
and plan to continue further testing.
In general, data processing instructions are easier to test thoroughly than
code that contains more branches such as changes in privilege level and exception handling.
The ["SDM"](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
remains the official specification of the architecture.

Our eventual goal is that the specification should be a completely accurate specification of
the architecture that you can rely on to determine how software will behave.
We are confident that we can achieve this goal but,
mostly because the specification is not complete, we are not yet
able to run all of the tests that we intend to run and so you should not rely on
the accuracy of this specification at this stage.

Note that any specification carries the risk of "overspecification" where a specification is consistent
with all the Intel processors that have ever been released, but (incorrectly) disallows
the (correct) behavior of a *future* processor.
We use code review to reduce the chance of this happening
but we may have to amend the specification in the future when
unintentional overspecification is discovered.



## What will change in future releases?

In general, future releases will specify more instructions; will cover
more of the underlying architecture
such as exceptions, memory paging and modes; will have fewer bugs; and
will be updated as the architecture is extended with new instructions and features.

We will try to prioritize adding the features that you tell us matter most to you
and improving parts of the specification that you find unclear.

Some specific questions about your priorities are


- Should we focus on commonly used features of the architecture (these are typically older) or should we focus more on recently added features of the architecture such as those in APX, AVX10 and the ISE (i.e., the [Intel® Architecture Instruction Set Extensions Programming Reference)](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)).

- Should we focus on adding more user-mode instructions or should we focus on system features, protection mechanisms, virtualization, the memory system, ...

- Do you want more of the same (i.e., executable specifications of instructions and features) or do you want details of MSRs and CPUID?
