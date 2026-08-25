---
layout: page
title: Frequently asked questions
---

This website contains a preview of how we intend to document and present
the Intel® Architecture in the future.
Our goals are to make the specification more accurate and accessible
and to receive feedback on how well we meet our goals before we apply this
approach to the
["SDM" (i.e., the Intel® 64 and IA-32 Architectures Software Development Manual)](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html).


This is not the official description of the Intel® Architecture.
For the official description of the Intel® Architecture, please see

- [Intel® 64 and IA-32 Architectures Software Development Manual](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html).
- [Intel® Intrinsics Guide](https://www.intel.com/content/www/us/en/docs/intrinsics-guide/index.html)
- [Intel® 64 and IA-32 Architectures Optimization Reference Manual](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html#inpage-nav-5)
- [Intel® Processors and Processor Cores based on Golden Cove Microarchitecture Instruction Throughput and Latency](https://cdrdv2.intel.com/v1/dl/getContent/723498)

{::nomarkdown}
<style>
.post-content h3 {
  font-size: 1.2em;
  font-weight: 600;
}
</style>

  <h2>This release</h2>

  <details>
      <summary>
          <h3>What is the purpose of this release?</h3>
      </summary>

      <p>To provide a more accessible way of navigating the instruction documentation;
      to improve the accuracy of the specification;
      and to enable feedback on how well we meet our goals before we apply this
      approach to the
      "SDM" (i.e., The <a href="https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html">Intel® 64 and IA-32 Architectures Software Development Manual</a>).
  </details>

  <details>
      <summary>
          <h3>How can I submit feedback on the preview?</h3>
      </summary>

      <p>
      Creating a website, writing executable instruction specifications, and
      designing a new ISA specification language required us to make many,
      many design decisions.
      While we hope that most of our decisions make it easier to correctly
      understand the Intel&reg; Architecture, we expect that some of our
      choices leave room for improvement.
      We would really appreciate it if you could give us feedback so that
      we can make the website better.
      </p>

      <p>
      Please fill out this <a href="{{ site.survey1 }}">short usability survey</a>.
      Alternatively, file a
      <a href="{{ site.public_github }}/issues">GitHub issue</a> about any problems you find.
      </p>
  </details>

  <details>
      <summary>
          <h3>How does this relate to the Software Developer's Manual</h3>
      </summary>

      <p>The "SDM" (i.e., The <a href="https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html">Intel® 64 and IA-32 Architectures Software Development Manual</a>)
      is the official specification of the Intel Architecture&trade;.

      <p>This preview shows some changes that we are planning to make to the
      SDM in the future.
  </details>


  <details>
      <summary>
          <h3>What is the release schedule?</h3>
      </summary>

      <p>We expect that releases will occur shortly after each quarterly release of the SDM.

      Each release will aim to add further instructions to the specification,
      to fix bugs in the specification, and to improve the navigability of
      the specification.

      We do not have a fixed plan for what will be in each release.

      At this stage, we do not know whether users will care most about
      "normal" scalar instructions, SIMD instructions, security features in the
      architecture, or something else.

      We want to retain the flexibility to respond to your priorities.
  </details>


  <h2>Stability and trustworthiness</h2>

  The specification and the machine readable database will change in the future
  and requires additional testing before it can be relied upon.

  <details>
      <summary>
          <h3>Is the specification currently complete?</h3>
      </summary>
      <p>No. The major omissions are instructions from the
      APX, AVX 10, SEAM, SMM, SGX, TSX, VMX extensions and
      instructions documented in the ISE.
      Our intention is to fill these gaps over time.

  </details>

  <details>
      <summary>
          <h3>Is the specification currently correct?</h3>
      </summary>
      <p>No. Although we have tested a lot of the specification, we have
      not performed all of the testing that we intend to do and
      some parts of the specification are still untested.

      We expect that we will find bugs and omissions in the specification
      as we continue to develop and validate the specification.
  </details>


  <details>
      <summary>
          <h3>What are your plans for the specification?</h3>
      </summary>

      <p>We aim to create a high quality specification of the Intel Architecture that describes at least
      all of the usermode behavior, privileged behavior, security checks, and major technologies
      such as VMX.

      <p>
      An unofficial goal is that the specification should be complete enough that it can model
      booting an OS from reset.

      It will take a few more years to complete, validate and review the specification to the
      standard required to achieve this.

      <p>
      We intend to make regular public releases of the specification and
      associated tools and to write blog articles that explain the state
      of the specification, our design choices, and how to use the
      specification.

      The blog (and this FAQ) will also be a place that we can address common questions and
      requests.


      <p>Although the  specification of instructions and helper functions is the most visible
      part of the architecture, we are also working to publish machine readable specifications
      of registers, MSRs, CPUID information, VMCS fields and other information that is readily
      captured in databases.

      These databases already exist internally but they are not always convenient to use and
      they often contain a combination of architectural information (that we want to release)
      and microarchitectural information (that is not appropriate to release).

      <p>We have a backlog of instruction specifications that we have specified but that have
      not been sufficiently validated or reviewed yet.

      There are many constraints on what we work on such as dependencies within the architecture,
      our ability to test the specification, getting reviews from the appropriate experts within
      the company, etc.

      Despite these constraints, we have a lot of flexibility about what we work on next
      so please let us know what parts of the architecture you would need.
  </details>


  <h2>The specification language</h2>

  <p>The specification is written in the Intel® Instruction Set Architecture Specification Language.

  This language has been designed to make it easier to read, to reduce the risk of misunderstanding,
  and to enable a broader range of uses of specifications.

  <details>
      <summary>
          <h3>I am confused by part of the Intel Architecture specification: what should I read?</h3>
      </summary>

      <p>Almost all users of ISA are only <emph>reading</emph> the specification (but not writing it)
      and do not need to understand the entire language.
      We recommend that you read
      <a href="reading-specs.html">Reading specifications</a>
      for a brief introduction to ISA and
      how we use ISA in the Intel Architecture specification.

      <p>If you still have questions, please submit an issue on
      <a href="{{ site.public_github }}/issues">GitHub</a>
      so that we can improve the specification or the
      <a href="reading-specs.html">Reading specifications</a> document.

  </details>


  <details>
      <summary>
          <h3>I am writing a tool to process ISA specifications: what should I read?</h3>
      </summary>

      <p>A small number of users of the specification need to understand what all the parts
      of the ISA language mean. This includes information that most users do not need
      to know such as all the "negative space" in the language (i.e.,
      things that are illegal) and the exact meaning of tricky corner cases.

      We recommend that you read
      <a href="sdm.html?docbook=The%20Intel®%20ISA%20Specification%20Language">The Intel® ISA Specification Language Reference Manual</a>
      and that you base tools on
      <a href="https://github.com/IntelLabs/isa-tools">ISA tools</a> (our interpreter/compiler for the language).

  </details>


  <h2>Feedback</h2>

  <p>The specification is rendered as a website both for ease of access and to experiment with
  how we can improve the presentation of the architecture.
  We welcome feedback on the usability of the website and how it can be improved.

  <p>
  Feedback can be sent using
  this <a href="{{ site.survey1 }}">short usability survey</a>
  or, for more detailed feedback, submitting an issue on
  <a href="{{ site.public_github }}/issues">GitHub</a>.

  Note that issues are public so please don't include confidential information.

  And if you make suggestions, note that the <a href="notices-and-disclaimers.html">License</a> states

  <blockquote cite="https://github.com/IntelLabs/isa-tools">
    If you give Intel any comments or suggestions related to this document or
    the information contained in it, Intel can use them in any way and disclose
    them to anyone, without payment or other obligations to you. You represent
    and warrant that you own, or have sufficient rights from the owner of, any
    such comments or suggestions, and the intellectual property rights in them,
    to grant the above permission.
  </blockquote>


{:/}
